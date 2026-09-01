using GSManagement.Api.Features.LeaveFeature.DTOs;
using GSManagement.Api.Shared.Utils;
using GSManagement.Domain.DB;
using GSManagement.Domain.Entities;
using GSManagement.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace GSManagement.Api.Features.LeaveFeature;

public class LeaveRequestService(GSDbContext context) : ILeaveRequestService
{
    // Swap this for whatever your actual context interface is called
    // (IApplicationDbContext / AppDbContext) - kept generic here.
    private readonly GSDbContext _context = context;

    public async Task<LeaveRequestDto> CreateAsync(CreateLeaveRequestDto dto, int createdByUserId)
    {
        if (dto.EndDate < dto.StartDate)
            throw new InvalidOperationException("End date cannot be before start date.");

        var employee = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == dto.UserId)
            ?? throw new KeyNotFoundException($"Employee with id {dto.UserId} was not found.");

        if (!employee.IsActive)
            throw new InvalidOperationException("Cannot create a leave request for an inactive employee.");

        // Blocks a new request if an existing one for the same user/dates is
        // Pending, Approved, or Reject - only a Cancelled request frees the
        // dates up for a new submission. (Previously Reject was excluded
        // here, meaning a rejected request didn't block resubmission - that
        // was changed on request.)
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

        // Block creation if any date in the requested range is a public holiday
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

        // Reload with the User navigation populated for the response DTO.
        entity.User = employee;
        return Map(entity);
    }

    public async Task<PagedResult<LeaveRequestDto>> GetAllAsync(LeaveRequestFilterDto filter)
    {
        var query = _context.LeaveRequests
            .Include(lr => lr.User)
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
            Items = items.Select(Map).ToList(),
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

        if (!string.IsNullOrWhiteSpace(dto.Note))
        {
            entity.Remark = string.IsNullOrWhiteSpace(entity.Remark)
                ? dto.Note
                : $"{entity.Remark}\n[{dto.Status}] {dto.Note}";
        }

        // If you add ActionedByUserId / ActionedAt columns (see suggestions),
        // set them here, e.g.:
        // entity.ActionedByUserId = actionedByUserId;
        // entity.ActionedAt = DateTime.UtcNow;
        var holidays = await PublicHolidaysHelper.GetHolidaysAsync(entity.StartDate.Year);
        var holidayDates = holidays.Select(h => DateOnly.FromDateTime(h.Date)).ToHashSet();


        if (dto.Status == LeaveStatus.Approved)
        {
            await SyncAttendanceForApprovedLeaveAsync(entity, holidayDates);
        }

        await _context.SaveChangesAsync();
        return Map(entity);
    }

    /// <summary>
    /// Creates or updates one Attendance row per day in the leave range,
    /// marking it as Leave and linking it back to this request. If a row
    /// already exists for that user/date (e.g. they'd already checked in
    /// before the leave was approved), it's overwritten rather than
    /// duplicated - Attendance has no unique constraint enforced here, so
    /// this manual lookup is what prevents duplicate rows per user/date.
    /// </summary>
    private async Task SyncAttendanceForApprovedLeaveAsync(LeaveRequest leaveRequest, HashSet<DateOnly> holidayDate)
    {
        var existing = await _context.Attendances
            .Where(a =>
                a.UserId == leaveRequest.UserId &&
                a.Date >= leaveRequest.StartDate &&
                a.Date <= leaveRequest.EndDate)
            .ToListAsync();

        var existingByDate = existing.ToDictionary(a => a.Date);

        // NOTE: this marks every calendar day in the range as Leave, except
        // Sunday - the company's fixed day off, so it's never touched here
        // and any existing record for that date (or lack of one) is left
        // alone. Swap the DayOfWeek check below if the off-day is different.
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
    };

    /// <summary>
    /// Inclusive day count between start and end, excluding Sundays (the
    /// company's day off) so it doesn't count against the employee's leave.
    /// </summary>
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