using GSManagement.Api.Shared.Utils;
using GSManagement.Domain.DB;
using GSManagement.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace GSManagement.Api.Features.AttendanceFeature.Summary;

/// <summary>
/// Builds the month view (one status per day + totals) for one or many
/// employees. The employee's own page, HR's employee page and the monthly
/// report all use this, so their numbers always agree.
///
/// Working days are Monday-Saturday minus public holidays, counted up to
/// today for the current month.
/// </summary>
public class AttendanceSummaryService(GSDbContext context)
{
    private readonly GSDbContext _context = context;

    private static readonly LeaveType[] LeaveTypes = Enum.GetValues<LeaveType>();

    public async Task<MonthSummaryDto?> GetForUserAsync(int userId, int year, int month)
    {
        var list = await GetAsync(year, month, userId);
        return list.FirstOrDefault();
    }

    /// <summary>All active employees, or one when <paramref name="userId"/> is given.</summary>
    public async Task<List<MonthSummaryDto>> GetAsync(int year, int month, int? userId = null)
    {
        var monthStart = new DateOnly(year, month, 1);
        var monthEnd = monthStart.AddMonths(1).AddDays(-1);
        var today = DateOnly.FromDateTime(DateTime.Today);
        var periodEnd = monthEnd < today ? monthEnd : today;

        var holidays = (await PublicHolidaysHelper.GetHolidaysAsync(year))
            .GroupBy(h => DateOnly.FromDateTime(h.Date))
            .ToDictionary(g => g.Key, g => g.First().EnglishName ?? g.First().KhmerName);

        var usersQuery = _context.Users.AsNoTracking().AsQueryable();
        usersQuery = userId is { } id
            ? usersQuery.Where(u => u.Id == id)
            : usersQuery.Where(u => u.IsActive);

        var users = (await usersQuery
            .OrderBy(u => u.UserName)
            .Select(u => new { u.Id, u.UserName, u.Email, u.ImageUrl, Roles = u.Roles.Select(r => r.RoleName).ToList() })
            .ToListAsync())
            .Select(u => new SummaryEmployeeDto(u.Id, u.UserName, u.Email, u.ImageUrl, string.Join(", ", u.Roles)))
            .ToList();

        var defaultShift = await _context.Shifts.AsNoTracking().FirstOrDefaultAsync(s => s.IsDefault)
            ?? await _context.Shifts.AsNoTracking().FirstOrDefaultAsync();

        var userIds = users.Select(u => u.Id).ToList();
        var records = await _context.Attendances
            .AsNoTracking()
            .Where(a => userIds.Contains(a.UserId) && a.Date >= monthStart && a.Date <= monthEnd)
            .Select(a => new
            {
                a.Id, a.UserId, a.Date, a.CheckInTime, a.CheckOutTime, a.Status,
                a.LateMinutes, a.EarlyLeaveMinutes, a.OvertimeMinutes, a.MissedClockOut,
                a.HalfDayPeriod, a.IsHalfDay, a.Remark, a.Shift,
                LeaveType = a.LeaveRequest != null ? (LeaveType?)a.LeaveRequest.LeaveType : null
            })
            .ToListAsync();

        var byUser = records.ToLookup(r => r.UserId);

        return users.Select(user =>
        {
            var mine = byUser[user.Id].ToDictionary(r => r.Date);
            var days = new List<SummaryDayDto>();
            var leaveByType = LeaveTypes.ToDictionary(t => t, _ => 0d);
            int workingDays = 0, present = 0, onTime = 0, late = 0, lateMin = 0, absent = 0,
                halfDays = 0, earlyDays = 0, missed = 0, workedMin = 0, otMin = 0;
            double leaveDays = 0;
            // Days actually attended, for the attendance rate: a worked half day counts 0.5.
            double attended = 0;

            for (var d = monthStart; d <= monthEnd; d = d.AddDays(1))
            {
                holidays.TryGetValue(d, out var holidayName);
                var isWorking = d.DayOfWeek != DayOfWeek.Sunday && holidayName is null;
                if (isWorking && d <= periodEnd) workingDays++;

                if (mine.TryGetValue(d, out var r))
                {
                    var status = r.Status switch
                    {
                        AttendanceStatus.OnLeave => DayStatus.OnLeave,
                        AttendanceStatus.Absent => DayStatus.Absent,
                        AttendanceStatus.HalfDay => DayStatus.HalfDay,
                        _ when d == today && r.CheckInTime != null && r.CheckOutTime == null => DayStatus.InProgress,
                        AttendanceStatus.Late => DayStatus.Late,
                        _ => DayStatus.Present
                    };

                    var worked = r.CheckInTime is { } i && r.CheckOutTime is { } o && o > i
                        ? (int)(o - i).TotalMinutes : 0;
                    var ot = (int)(r.OvertimeMinutes ?? 0);

                    switch (r.Status)
                    {
                        case AttendanceStatus.Present: present++; attended += 1; onTime++; break;
                        case AttendanceStatus.Late: present++; attended += 1; late++; lateMin += r.LateMinutes; break;
                        case AttendanceStatus.Absent: absent++; break;
                        case AttendanceStatus.OnLeave:
                            leaveDays += 1;
                            if (r.LeaveType is { } lt) leaveByType[lt] += 1;
                            break;
                        case AttendanceStatus.HalfDay:
                            leaveDays += 0.5; halfDays++;
                            if (r.LeaveType is { } ht) leaveByType[ht] += 0.5;
                            // The working half counts as attended, and is on time or late
                            // against the shortened window like any other day.
                            if (r.CheckInTime is not null)
                            {
                                present++;
                                attended += 0.5;
                                if (r.LateMinutes > 0) { late++; lateMin += r.LateMinutes; }
                                else onTime++;
                            }
                            break;
                    }
                    if (r.EarlyLeaveMinutes > 0) earlyDays++;
                    if (r.MissedClockOut) missed++;
                    workedMin += worked;
                    otMin += ot;

                    var window = AttendanceRules.ExpectedWindow(
                        r.Shift ?? defaultShift, r.Status == AttendanceStatus.HalfDay || r.IsHalfDay, r.HalfDayPeriod);
                    var hours = r.Status == AttendanceStatus.OnLeave ? ((TimeOnly?)null, (TimeOnly?)null)
                        : ((TimeOnly?)window.Start, (TimeOnly?)window.End);

                    days.Add(new SummaryDayDto(
                        d, status, r.Id, holidayName, r.CheckInTime, r.CheckOutTime, worked,
                        r.LateMinutes, r.EarlyLeaveMinutes, ot, r.MissedClockOut,
                        r.LeaveType, r.HalfDayPeriod, r.Shift?.Name, r.Remark, hours.Item1, hours.Item2));
                    continue;
                }

                var empty = d.DayOfWeek == DayOfWeek.Sunday ? DayStatus.DayOff
                    : holidayName is not null ? DayStatus.Holiday
                    : d > today ? DayStatus.Upcoming
                    : d == today ? DayStatus.NotClockedIn
                    : DayStatus.NoRecord;

                var (start, end, _) = AttendanceRules.ExpectedWindow(defaultShift, false, null);
                days.Add(new SummaryDayDto(d, empty, null, holidayName, null, null, 0, 0, 0, 0,
                    false, null, null, null, null,
                    isWorking ? start : null, isWorking ? end : null));
            }

            var expected = workingDays - leaveDays;
            var totals = new SummaryTotalsDto(
                workingDays, present, onTime, late, lateMin, absent, leaveDays, halfDays,
                earlyDays, missed,
                Math.Round(workedMin / 60.0, 2),
                Math.Round(otMin / 60.0, 2),
                present > 0 ? Math.Round(workedMin / 60.0 / present, 2) : 0,
                expected > 0 ? Math.Min(100, Math.Round(attended / expected * 100, 1)) : 100,
                present > 0 ? Math.Round(onTime * 100.0 / present, 1) : 100,
                leaveByType);

            return new MonthSummaryDto(year, month, periodEnd, user, totals, days);
        }).ToList();
    }
}
