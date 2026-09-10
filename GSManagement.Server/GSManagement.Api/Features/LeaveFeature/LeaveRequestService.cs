using GSManagement.Api.Features.LeaveFeature.DTOs;
using GSManagement.Api.Shared.Utils;
using GSManagement.Domain.DB;
using GSManagement.Domain.Entities;
using GSManagement.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace GSManagement.Api.Features.LeaveFeature;

public class LeaveRequestService(GSDbContext context) : ILeaveRequestService
{
    private readonly GSDbContext _context = context;

    public async Task<LeaveRequestDto> CreateAsync(CreateLeaveRequestDto dto, int approvedByUserId)
    {
        if (dto.EndDate < dto.StartDate)
            throw new InvalidOperationException("End date cannot be before start date.");

        var employee = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == dto.UserId)
            ?? throw new KeyNotFoundException($"Employee with id {dto.UserId} was not found.");

        if (!employee.IsActive)
            throw new InvalidOperationException("Cannot create a leave request for an inactive employee.");

        var overlaps = await _context.LeaveRequests.AnyAsync(lr =>
            lr.UserId == dto.UserId &&
            lr.Status != LeaveStatus.Cancel &&
            lr.StartDate <= dto.EndDate &&
            lr.EndDate >= dto.StartDate);

        if (overlaps)
            throw new InvalidOperationException("This employee already has a leave request that overlaps these dates.");

        var holidays = await PublicHolidaysHelper.GetHolidaysAsync(dto.StartDate.Year);
        if (dto.EndDate.Year != dto.StartDate.Year)
        {
            var nextYearHolidays = await PublicHolidaysHelper.GetHolidaysAsync(dto.EndDate.Year);
            holidays.AddRange(nextYearHolidays);
        }

        var holidayDates = holidays.Select(h => DateOnly.FromDateTime(h.Date)).ToHashSet();

        for (var date = dto.StartDate; date <= dto.EndDate; date = date.AddDays(1))
        {
            if (holidayDates.Contains(date))
            {
                var holidayInfo = holidays.First(h => DateOnly.FromDateTime(h.Date) == date);
                throw new InvalidOperationException(
                    $"Cannot create leave request. {date:yyyy-MM-dd} is a public holiday ({holidayInfo.EnglishName}).");
            }
        }

        if (CountWorkingDays(dto.StartDate, dto.EndDate) == 0)
            throw new InvalidOperationException("This date range only covers Sunday, which is already a day off - no leave request is needed.");

        var entity = new LeaveRequest
        {
            UserId = dto.UserId,
            LeaveType = dto.LeaveType,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Remark = dto.Remark,
            Status = dto.InitialStatus,
            CreatedAt = DateOnly.FromDateTime(DateTime.UtcNow),
        };

        _context.LeaveRequests.Add(entity);
        await _context.SaveChangesAsync();

        if (entity.Status == LeaveStatus.Approved)
        {
            await SyncAttendanceForApprovedLeaveAsync(entity, holidayDates);
            await _context.SaveChangesAsync();
        }

        entity.User = employee;
        return Map(entity);
    }

    public async Task<PagedResult<LeaveRequestDto>> GetAllAsync(LeaveRequestFilterDto filter)
    {
        var query = _context.LeaveRequests
            .Include(lr => lr.User)
            .Include(lr => lr.Approver)
            .AsQueryable();

        if (filter.UserId is not null)
            query = query.Where(lr => lr.UserId == filter.UserId);

        if (filter.Status is not null)
            query = query.Where(lr => lr.Status == filter.Status);

        if (filter.LeaveType is not null)
            query = query.Where(lr => lr.LeaveType == filter.LeaveType);

        if (filter.FromDate is not null)
            query = query.Where(lr => lr.EndDate >= filter.FromDate);

        if (filter.ToDate is not null)
            query = query.Where(lr => lr.StartDate <= filter.ToDate);

        if (!string.IsNullOrWhiteSpace(filter.Search))
            query = query.Where(lr => lr.User != null
                && lr.User.UserName.ToLower().Contains(filter.Search.ToLower()));

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(lr => lr.CreatedAt)
            .ThenByDescending(lr => lr.Id)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new PagedResult<LeaveRequestDto>
        {
            Items = items.ConvertAll(Map),
            TotalCount = totalCount,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize,
        };
    }

    public async Task<LeaveRequestDto?> GetByIdAsync(int id)
    {
        var entity = await _context.LeaveRequests
            .Include(lr => lr.User)
            .FirstOrDefaultAsync(lr => lr.Id == id);

        return entity is null ? null : Map(entity);
    }

    public async Task<LeaveRequestDto> UpdateStatusAsync(int id, UpdateLeaveRequestStatusDto dto, int actionedByUserId)
    {
        var entity = await _context.LeaveRequests
            .Include(lr => lr.User)
            .FirstOrDefaultAsync(lr => lr.Id == id)
            ?? throw new KeyNotFoundException($"Leave request {id} was not found.");

        if (entity.Status != LeaveStatus.Pending)
        {
            throw new InvalidOperationException(
                $"Only pending requests can be actioned. This request is already '{entity.Status}'.");
        }

        if (dto.Status != LeaveStatus.Approved && dto.Status != LeaveStatus.Reject)
            throw new InvalidOperationException("Status can only be changed to Approved or Reject here.");

        entity.Status = dto.Status;
        entity.ApproverId = actionedByUserId;

        if (!string.IsNullOrWhiteSpace(dto.Note))
        {
            entity.Remark = string.IsNullOrWhiteSpace(entity.Remark)
                ? dto.Note
                : $"{entity.Remark}\n[{dto.Status}] {dto.Note}";
        }

        var holidays = await PublicHolidaysHelper.GetHolidaysAsync(entity.StartDate.Year);
        var holidayDates = holidays.Select(h => DateOnly.FromDateTime(h.Date)).ToHashSet();

        if (dto.Status == LeaveStatus.Approved)
        {
            await SyncAttendanceForApprovedLeaveAsync(entity, holidayDates);
        }

        await _context.SaveChangesAsync();
        return Map(entity);
    }

    public async Task<LeaveRequestDto> UpdateAsync(int id, UpdateLeaveRequestDto dto, int actionedByUserId)
    {
        if (dto.EndDate < dto.StartDate)
            throw new InvalidOperationException("End date cannot be before start date.");

        var entity = await _context.LeaveRequests
            .Include(lr => lr.User)
            .FirstOrDefaultAsync(lr => lr.Id == id)
            ?? throw new KeyNotFoundException($"Leave request {id} was not found.");

        var employee = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == dto.UserId)
            ?? throw new KeyNotFoundException($"Employee with id {dto.UserId} was not found.");

        if (!employee.IsActive)
            throw new InvalidOperationException("Cannot set a leave request for an inactive employee.");

        var overlaps = await _context.LeaveRequests.AnyAsync(lr =>
            lr.Id != id &&
            lr.UserId == dto.UserId &&
            lr.Status != LeaveStatus.Cancel &&
            lr.StartDate <= dto.EndDate &&
            lr.EndDate >= dto.StartDate);

        if (overlaps)
            throw new InvalidOperationException("This employee already has another leave request that overlaps these dates.");

        var holidays = await PublicHolidaysHelper.GetHolidaysAsync(dto.StartDate.Year);
        if (dto.EndDate.Year != dto.StartDate.Year)
        {
            var nextYearHolidays = await PublicHolidaysHelper.GetHolidaysAsync(dto.EndDate.Year);
            holidays.AddRange(nextYearHolidays);
        }

        var holidayDates = holidays.Select(h => DateOnly.FromDateTime(h.Date)).ToHashSet();

        for (var date = dto.StartDate; date <= dto.EndDate; date = date.AddDays(1))
        {
            if (holidayDates.Contains(date))
            {
                var holidayInfo = holidays.First(h => DateOnly.FromDateTime(h.Date) == date);
                throw new InvalidOperationException(
                    $"Cannot set leave request. {date:yyyy-MM-dd} is a public holiday ({holidayInfo.EnglishName}).");
            }
        }

        if (CountWorkingDays(dto.StartDate, dto.EndDate) == 0)
            throw new InvalidOperationException("This date range only covers Sunday, which is already a day off - no leave request is needed.");

        entity.UserId = dto.UserId;
        entity.User = employee;
        entity.LeaveType = dto.LeaveType;
        entity.StartDate = dto.StartDate;
        entity.EndDate = dto.EndDate;
        entity.Status = dto.Status;
        entity.Remark = dto.Remark;
        entity.ApproverId = actionedByUserId;

        if (entity.Status == LeaveStatus.Approved)
        {
            await SyncAttendanceForApprovedLeaveAsync(entity, holidayDates);
        }

        await _context.SaveChangesAsync();
        return Map(entity);
    }

    private async Task SyncAttendanceForApprovedLeaveAsync(LeaveRequest leaveRequest, HashSet<DateOnly> holidayDate)
    {
        var existing = await _context.Attendances
            .Where(a =>
                a.UserId == leaveRequest.UserId &&
                a.Date >= leaveRequest.StartDate &&
                a.Date <= leaveRequest.EndDate)
            .ToListAsync();

        var existingByDate = existing.ToDictionary(a => a.Date);

        for (var date = leaveRequest.StartDate; date <= leaveRequest.EndDate; date = date.AddDays(1))
        {
            if (date.DayOfWeek == DayOfWeek.Sunday || holidayDate.Contains(date)) continue;

            if (existingByDate.TryGetValue(date, out var attendance))
            {
                attendance.Status = AttendanceStatus.Leave;
                attendance.LeaveRequestId = leaveRequest.Id;
                attendance.CheckInTime = null;
                attendance.CheckOutTime = null;
            }
            else
            {
                _context.Attendances.Add(new Attendance
                {
                    UserId = leaveRequest.UserId,
                    Date = date,
                    Status = AttendanceStatus.Leave,
                    LeaveRequestId = leaveRequest.Id,
                });
            }
        }
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _context.LeaveRequests.FindAsync(id)
            ?? throw new KeyNotFoundException($"Leave request {id} was not found.");

        _context.LeaveRequests.Remove(entity);
        await _context.SaveChangesAsync();
    }

    private static LeaveRequestDto Map(LeaveRequest entity) => new()
    {
        Id = entity.Id,
        UserId = entity.UserId,
        UserName = entity.User?.UserName ?? string.Empty,
        UserImageUrl = entity.User?.ImageUrl,
        LeaveType = entity.LeaveType,
        StartDate = entity.StartDate,
        EndDate = entity.EndDate,
        TotalDays = CountWorkingDays(entity.StartDate, entity.EndDate),
        Status = entity.Status,
        Remark = entity.Remark,
        CreatedAt = entity.CreatedAt,
        ApproverName = entity.Approver != null ? entity.Approver!.UserName : null,
    };

    private static int CountWorkingDays(DateOnly start, DateOnly end)
    {
        var count = 0;
        for (var date = start; date <= end; date = date.AddDays(1))
        {
            if (date.DayOfWeek != DayOfWeek.Sunday) count++;
        }
        return count;
    }
}