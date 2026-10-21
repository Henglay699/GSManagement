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

        if (dto.IsHalfDay)
        {
            if (dto.StartDate != dto.EndDate)
                throw new InvalidOperationException("Half-day leave must be for a single date (start and end date must match).");
            if (!dto.HalfDayPeriod.HasValue)
                throw new InvalidOperationException("Please select whether the half-day leave is Morning or Afternoon.");
        }

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

        // Check if employee already has attendance records (clocked in / worked) on these dates
        await ValidateNoConflictingAttendanceAsync(dto.UserId, dto.StartDate, dto.EndDate, dto.IsHalfDay, dto.HalfDayPeriod);

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
            IsHalfDay = dto.IsHalfDay,
            HalfDayPeriod = dto.IsHalfDay ? dto.HalfDayPeriod : null,
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
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(lr =>
                lr.User != null && lr.User.UserName.ToLower().Contains(search) ||
                lr.Remark != null && lr.Remark.ToLower().Contains(search));
        }

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
            .Include(lr => lr.Approver)
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

        if (dto.Status == LeaveStatus.Approved)
        {
            // Verify employee didn't clock in / work during the pending review period
            await ValidateNoConflictingAttendanceAsync(entity.UserId, entity.StartDate, entity.EndDate, entity.IsHalfDay, entity.HalfDayPeriod, entity.Id);
        }

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
        else if (dto.Status == LeaveStatus.Reject)
        {
            await _context.Attendances.Where(a => a.LeaveRequestId == id).ExecuteDeleteAsync();
        }

        await _context.SaveChangesAsync();
        return Map(entity);
    }

    public async Task<LeaveRequestDto> CancelOwnAsync(int id, int userId)
    {
        var entity = await _context.LeaveRequests
            .Include(lr => lr.User)
            .FirstOrDefaultAsync(lr => lr.Id == id && lr.UserId == userId)
            ?? throw new KeyNotFoundException($"Leave request {id} was not found.");

        if (entity.Status != LeaveStatus.Pending)
            throw new InvalidOperationException(
                $"Only pending requests can be cancelled. This request is already '{entity.Status}'.");

        entity.Status = LeaveStatus.Cancel;
        await _context.SaveChangesAsync();
        return Map(entity);
    }

    public async Task<LeaveRequestDto> UpdateAsync(int id, UpdateLeaveRequestDto dto, int actionedByUserId)
    {
        if (dto.EndDate < dto.StartDate)
            throw new InvalidOperationException("End date cannot be before start date.");

        if (dto.IsHalfDay)
        {
            if (dto.StartDate != dto.EndDate)
                throw new InvalidOperationException("Half-day leave must be for a single date (start and end date must match).");
            if (!dto.HalfDayPeriod.HasValue)
                throw new InvalidOperationException("Please select whether the half-day leave is Morning or Afternoon.");
        }

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

        // Check if employee already has attendance records (clocked in / worked) on these dates
        await ValidateNoConflictingAttendanceAsync(dto.UserId, dto.StartDate, dto.EndDate, dto.IsHalfDay, dto.HalfDayPeriod, id);

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

        // 1. Remove all existing attendance records synced to this leave request ID
        await _context.Attendances
            .Where(a => a.LeaveRequestId == id)
            .ExecuteDeleteAsync();

        // 2. Update entity properties
        entity.UserId = dto.UserId;
        entity.User = employee;
        entity.LeaveType = dto.LeaveType;
        entity.StartDate = dto.StartDate;
        entity.EndDate = dto.EndDate;
        entity.Status = dto.Status;
        entity.Remark = dto.Remark;
        entity.ApproverId = actionedByUserId;
        entity.IsHalfDay = dto.IsHalfDay;
        entity.HalfDayPeriod = dto.IsHalfDay ? dto.HalfDayPeriod : null;

        // 3. Sync attendance again ONLY if the updated status is Approved
        if (entity.Status == LeaveStatus.Approved)
        {
            await SyncAttendanceForApprovedLeaveAsync(entity, holidayDates);
        }

        await _context.SaveChangesAsync();
        return Map(entity);
    }

    private async Task ValidateNoConflictingAttendanceAsync(
        int userId,
        DateOnly startDate,
        DateOnly endDate,
        bool isHalfDay,
        HalfDayPeriod? halfDayPeriod,
        int? currentLeaveRequestId = null)
    {
        var existingAttendances = await _context.Attendances
            .Where(a => a.UserId == userId &&
                        a.Date >= startDate &&
                        a.Date <= endDate &&
                        (currentLeaveRequestId == null || a.LeaveRequestId != currentLeaveRequestId))
            .ToListAsync();

        if (existingAttendances.Count == 0) return;

        if (!isHalfDay)
        {
            // For full-day leave: employee cannot take leave if they already clocked in or worked on that day
            var attended = existingAttendances
                .Where(a => a.CheckInTime != null || a.Status == AttendanceStatus.OnTime || a.Status == AttendanceStatus.Late)
                .Select(a => a.Date.ToString("yyyy-MM-dd"))
                .ToList();

            if (attended.Count > 0)
            {
                throw new InvalidOperationException(
                    $"Cannot request full-day leave. Attendance records with check-in/presence already exist on: {string.Join(", ", attended)}.");
            }
        }
        else
        {
            // For half-day leave: check if the employee already completed a full day
            var targetDay = existingAttendances.FirstOrDefault(a => a.Date == startDate);
            if (targetDay != null)
            {
                if (targetDay.CheckInTime != null && targetDay.CheckOutTime != null && !targetDay.IsHalfDay)
                {
                    throw new InvalidOperationException(
                        $"Cannot request half-day leave on {startDate:yyyy-MM-dd}. A full workday attendance has already been completed for this day.");
                }

                if (targetDay.IsHalfDay && targetDay.HalfDayPeriod == halfDayPeriod)
                {
                    throw new InvalidOperationException(
                        $"A half-day leave for {halfDayPeriod} already exists on {startDate:yyyy-MM-dd}.");
                }
            }
        }
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
                attendance.Status = leaveRequest.IsHalfDay ? AttendanceStatus.HalfDayLeave : AttendanceStatus.Leave;
                attendance.LeaveRequestId = leaveRequest.Id;
                attendance.IsHalfDay = leaveRequest.IsHalfDay;
                attendance.HalfDayPeriod = leaveRequest.HalfDayPeriod;
                if (!leaveRequest.IsHalfDay)
                {
                    attendance.CheckInTime = null;
                    attendance.CheckOutTime = null;
                }
            }
            else
            {
                _context.Attendances.Add(new Attendance
                {
                    UserId = leaveRequest.UserId,
                    Date = date,
                    Status = leaveRequest.IsHalfDay ? AttendanceStatus.HalfDayLeave : AttendanceStatus.Leave,
                    LeaveRequestId = leaveRequest.Id,
                    IsHalfDay = leaveRequest.IsHalfDay,
                    HalfDayPeriod = leaveRequest.HalfDayPeriod
                });
            }
        }
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _context.LeaveRequests.FindAsync(id)
            ?? throw new KeyNotFoundException($"Leave request {id} was not found.");

        await _context.Attendances.Where(a => a.LeaveRequestId == id).ExecuteDeleteAsync();
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
        IsHalfDay = entity.IsHalfDay,
        HalfDayPeriod = entity.HalfDayPeriod,
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