using GSManagement.Api.Features.AttendanceFeature;
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
            lr.Status != LeaveStatus.Reject &&
            lr.StartDate <= dto.EndDate &&
            lr.EndDate >= dto.StartDate);

        if (overlaps)
            throw new InvalidOperationException("This employee already has a leave request that overlaps these dates.");

        // Check if employee already has attendance records (clocked in / worked) on these dates
        await ValidateNoConflictingAttendanceAsync(dto.UserId, dto.StartDate, dto.EndDate, dto.IsHalfDay, dto.HalfDayPeriod);

        // Sundays and public holidays inside the range are simply not leave days.
        var holidayDates = await HolidayDatesAsync(dto.StartDate, dto.EndDate);
        if (CountWorkingDays(dto.StartDate, dto.EndDate, holidayDates) == 0)
            throw new InvalidOperationException(
                "These dates only cover Sundays and public holidays, which are already days off - no leave request is needed.");

        var entity = new LeaveRequest
        {
            UserId = dto.UserId,
            LeaveType = dto.LeaveType,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Remark = dto.Remark,
            Status = dto.InitialStatus,
            CreatedAt = AppClock.Today,
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
        return await MapSavedAsync(entity);
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
        var holidays = items.Count == 0
            ? []
            : await HolidayDatesAsync(items.Min(lr => lr.StartDate), items.Max(lr => lr.EndDate));

        return new PagedResult<LeaveRequestDto>
        {
            Items = items.ConvertAll(e => Map(e, holidays)),
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

        return entity is null ? null : Map(entity, await HolidayDatesAsync(entity.StartDate, entity.EndDate));
    }

    public async Task<LeaveRequestDto> UpdateStatusAsync(int id, UpdateLeaveRequestStatusDto dto, int actionedByUserId)
    {
        var entity = await _context.LeaveRequests
            .Include(lr => lr.User)
            .FirstOrDefaultAsync(lr => lr.Id == id)
            ?? throw new KeyNotFoundException($"Leave request {id} was not found.");

        // Approve or reject a pending request; cancel a pending or an approved one
        // (approved leave is withdrawn and its days go back to normal attendance).
        var allowed = dto.Status switch
        {
            LeaveStatus.Approved or LeaveStatus.Reject => entity.Status == LeaveStatus.Pending,
            LeaveStatus.Cancel => entity.Status is LeaveStatus.Pending or LeaveStatus.Approved,
            _ => false,
        };
        if (!allowed)
        {
            throw new InvalidOperationException(dto.Status == LeaveStatus.Cancel
                ? $"Only pending or approved requests can be cancelled. This request is already '{entity.Status}'."
                : $"Only pending requests can be approved or rejected. This request is already '{entity.Status}'.");
        }

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

        if (dto.Status == LeaveStatus.Approved)
        {
            var holidayDates = await HolidayDatesAsync(entity.StartDate, entity.EndDate);
            await SyncAttendanceForApprovedLeaveAsync(entity, holidayDates);
        }
        else
        {
            await ReleaseAttendanceForLeaveAsync(id);
        }

        await _context.SaveChangesAsync();
        return await MapSavedAsync(entity);
    }

    public async Task<LeaveRequestDto> CancelOwnAsync(int id, int userId)
    {
        var entity = await _context.LeaveRequests
            .Include(lr => lr.User)
            .FirstOrDefaultAsync(lr => lr.Id == id && lr.UserId == userId)
            ?? throw new KeyNotFoundException($"Leave request {id} was not found.");

        var cancellable = entity.Status == LeaveStatus.Pending ||
            (entity.Status == LeaveStatus.Approved && entity.StartDate > AppClock.Today);
        if (!cancellable)
            throw new InvalidOperationException(entity.Status == LeaveStatus.Approved
                ? "This leave has already started. Ask HR to cancel it."
                : $"Only pending requests, or approved leave that hasn't started, can be cancelled. This request is already '{entity.Status}'.");

        var wasApproved = entity.Status == LeaveStatus.Approved;
        entity.Status = LeaveStatus.Cancel;
        if (wasApproved) await ReleaseAttendanceForLeaveAsync(id);
        await _context.SaveChangesAsync();
        return await MapSavedAsync(entity);
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
            lr.Status != LeaveStatus.Reject &&
            lr.StartDate <= dto.EndDate &&
            lr.EndDate >= dto.StartDate);

        if (overlaps)
            throw new InvalidOperationException("This employee already has another leave request that overlaps these dates.");

        // Check if employee already has attendance records (clocked in / worked) on these dates
        await ValidateNoConflictingAttendanceAsync(dto.UserId, dto.StartDate, dto.EndDate, dto.IsHalfDay, dto.HalfDayPeriod, id);

        // Sundays and public holidays inside the range are simply not leave days.
        var holidayDates = await HolidayDatesAsync(dto.StartDate, dto.EndDate);
        if (CountWorkingDays(dto.StartDate, dto.EndDate, holidayDates) == 0)
            throw new InvalidOperationException(
                "These dates only cover Sundays and public holidays, which are already days off - no leave request is needed.");

        // 1. Remove all existing attendance records synced to this leave request ID
        await ReleaseAttendanceForLeaveAsync(id);

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
        return await MapSavedAsync(entity);
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
                .Where(a => a.CheckInTime != null || a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late)
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
        var defaultShift = await _context.Shifts.FirstOrDefaultAsync(s => s.IsDefault);

        for (var date = leaveRequest.StartDate; date <= leaveRequest.EndDate; date = date.AddDays(1))
        {
            if (date.DayOfWeek == DayOfWeek.Sunday || holidayDate.Contains(date)) continue;

            if (!existingByDate.TryGetValue(date, out var attendance))
            {
                attendance = new Attendance { UserId = leaveRequest.UserId, Date = date };
                _context.Attendances.Add(attendance);
            }

            attendance.Status = leaveRequest.IsHalfDay ? AttendanceStatus.HalfDay : AttendanceStatus.OnLeave;
            attendance.LeaveRequestId = leaveRequest.Id;
            attendance.IsHalfDay = leaveRequest.IsHalfDay;
            attendance.HalfDayPeriod = leaveRequest.HalfDayPeriod;
            attendance.ShiftId ??= defaultShift?.Id;
            // Half-day keeps any clock times and is re-scored against the shorter window.
            AttendanceRules.Apply(attendance, defaultShift);
        }
    }

    /// <summary>
    /// Undoes a leave's effect on attendance: days the employee also worked
    /// (half-day with a clock-in) go back to normal worked days; past days with
    /// no clock-in become Absent (the nightly close-out skipped them because of
    /// the leave); today and future days are removed.
    /// </summary>
    private async Task ReleaseAttendanceForLeaveAsync(int leaveRequestId)
    {
        var records = await _context.Attendances
            .Include(a => a.Shift)
            .Where(a => a.LeaveRequestId == leaveRequestId)
            .ToListAsync();
        if (records.Count == 0) return;

        var defaultShift = await _context.Shifts.FirstOrDefaultAsync(s => s.IsDefault);
        foreach (var a in records)
        {
            if (a.CheckInTime is null && a.Date >= AppClock.Today)
            {
                _context.Attendances.Remove(a);
                continue;
            }
            a.LeaveRequestId = null;
            a.IsHalfDay = false;
            a.HalfDayPeriod = null;
            a.Status = a.CheckInTime is null ? AttendanceStatus.Absent : AttendanceStatus.Present;
            AttendanceRules.Apply(a, a.Shift ?? defaultShift);
        }
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _context.LeaveRequests.FindAsync(id)
            ?? throw new KeyNotFoundException($"Leave request {id} was not found.");

        await ReleaseAttendanceForLeaveAsync(id);
        _context.LeaveRequests.Remove(entity);
        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// After a write: make sure the employee and the (possibly new) approver are
    /// loaded, so the response matches what a fresh read of the request returns.
    /// </summary>
    private async Task<LeaveRequestDto> MapSavedAsync(LeaveRequest entity)
    {
        var entry = _context.Entry(entity);
        if (!entry.Reference(e => e.User).IsLoaded)
            await entry.Reference(e => e.User).LoadAsync();

        var approver = entry.Reference(e => e.Approver);
        if (entity.ApproverId is not null && approver.CurrentValue?.Id != entity.ApproverId)
        {
            approver.IsLoaded = false;
            await approver.LoadAsync();
        }
        return Map(entity, await HolidayDatesAsync(entity.StartDate, entity.EndDate));
    }

    private static LeaveRequestDto Map(LeaveRequest entity, HashSet<DateOnly> holidays) => new()
    {
        Id = entity.Id,
        UserId = entity.UserId,
        UserName = entity.User?.UserName ?? string.Empty,
        UserImageUrl = entity.User?.ImageUrl,
        LeaveType = entity.LeaveType,
        StartDate = entity.StartDate,
        EndDate = entity.EndDate,
        TotalDays = CountWorkingDays(entity.StartDate, entity.EndDate, holidays),
        Status = entity.Status,
        Remark = entity.Remark,
        CreatedAt = entity.CreatedAt,
        ApproverName = entity.Approver != null ? entity.Approver!.UserName : null,
        IsHalfDay = entity.IsHalfDay,
        HalfDayPeriod = entity.HalfDayPeriod,
    };

    /// <summary>Leave days in a range: everything but Sundays and public holidays.</summary>
    private static int CountWorkingDays(DateOnly start, DateOnly end, HashSet<DateOnly> holidays)
    {
        var count = 0;
        for (var date = start; date <= end; date = date.AddDays(1))
        {
            if (date.DayOfWeek != DayOfWeek.Sunday && !holidays.Contains(date)) count++;
        }
        return count;
    }

    /// <summary>Public holiday dates for every year the range touches.</summary>
    private static async Task<HashSet<DateOnly>> HolidayDatesAsync(DateOnly from, DateOnly to)
    {
        var dates = new HashSet<DateOnly>();
        for (var year = from.Year; year <= to.Year; year++)
            foreach (var h in await PublicHolidaysHelper.GetHolidaysAsync(year))
                dates.Add(DateOnly.FromDateTime(h.Date));
        return dates;
    }
}