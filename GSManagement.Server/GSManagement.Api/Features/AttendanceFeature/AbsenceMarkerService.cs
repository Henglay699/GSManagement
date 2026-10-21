using GSManagement.Api.Shared.Utils;
using GSManagement.Domain.DB;
using GSManagement.Domain.Entities;
using GSManagement.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace GSManagement.Api.Features.AttendanceFeature;

// Closes out each working day just after midnight:
// - active employees with no attendance record for the day are marked Absent;
// - records that have a clock-in but no clock-out keep their status and get a
//   "Missed clock-out" remark so HR can follow up.
// Days on approved leave already have a record (from the leave sync), so
// they're left alone. Sundays and public holidays are skipped.
//
// Also runs once at startup for the previous day, so a restart over midnight
// doesn't skip it. Every step is idempotent, so running twice is harmless.
public sealed class AbsenceMarkerService(
    IServiceScopeFactory scopeFactory,
    ILogger<AbsenceMarkerService> logger) : BackgroundService
{
    // A few minutes past midnight so late clock-outs right at 00:00 land first.
    private static readonly TimeSpan RunAt = TimeSpan.FromMinutes(5);

    public const string MissedClockOutRemark = "Missed clock-out";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await RunSafelyAsync(stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            var nextRun = DateTime.Today.AddDays(1).Add(RunAt);
            var delay = nextRun - DateTime.Now;
            if (delay > TimeSpan.Zero)
                await Task.Delay(delay, stoppingToken);

            await RunSafelyAsync(stoppingToken);
        }
    }

    private async Task RunSafelyAsync(CancellationToken ct)
    {
        var day = DateOnly.FromDateTime(DateTime.Today.AddDays(-1));
        try
        {
            await MarkDayAsync(day, ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to close out attendance for {Day}", day);
        }
    }

    public async Task MarkDayAsync(DateOnly day, CancellationToken ct)
    {
        if (day.DayOfWeek == DayOfWeek.Sunday)
            return;

        var holidays = await PublicHolidaysHelper.GetHolidaysAsync(day.Year);
        if (holidays.Any(h => DateOnly.FromDateTime(h.Date) == day))
            return;

        using var scope = scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GSDbContext>();

        var recordedUserIds = await context.Attendances
            .Where(a => a.Date == day)
            .Select(a => a.UserId)
            .ToListAsync(ct);

        var absentUserIds = await context.Users
            .Where(u => u.IsActive && !recordedUserIds.Contains(u.Id))
            .Select(u => u.Id)
            .ToListAsync(ct);

        var defaultShiftId = await context.Shifts
            .Where(s => s.IsDefault)
            .Select(s => (int?)s.Id)
            .FirstOrDefaultAsync(ct);

        context.Attendances.AddRange(absentUserIds.Select(userId => new Attendance
        {
            UserId = userId,
            Date = day,
            Status = AttendanceStatus.Absent,
            Remark = "No clock-in (marked automatically)",
            ShiftId = defaultShiftId
        }));

        var missedClockOut = await context.Attendances
            .Where(a => a.Date == day
                && a.CheckInTime != null
                && a.CheckOutTime == null
                && (a.Remark == null || !a.Remark.Contains(MissedClockOutRemark)))
            .ToListAsync(ct);

        foreach (var attendance in missedClockOut)
        {
            attendance.Remark = string.IsNullOrWhiteSpace(attendance.Remark)
                ? MissedClockOutRemark
                : $"{attendance.Remark}; {MissedClockOutRemark}";
        }

        await context.SaveChangesAsync(ct);

        logger.LogInformation(
            "Closed out attendance for {Day}: {Absent} marked absent, {MissedOut} missed clock-out",
            day, absentUserIds.Count, missedClockOut.Count);
    }
}
