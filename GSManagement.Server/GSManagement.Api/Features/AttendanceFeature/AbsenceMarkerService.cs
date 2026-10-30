using GSManagement.Api.Shared.Utils;
using GSManagement.Domain.DB;
using GSManagement.Domain.Entities;
using GSManagement.Domain.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace GSManagement.Api.Features.AttendanceFeature;

// Closes out working days just after midnight (company time):
// - active employees with no attendance record for the day are marked Absent;
// - records that have a clock-in but no clock-out keep their status and are
//   flagged MissedClockOut so HR can follow up.
// Days on approved leave already have a record (from the leave sync), so
// they're left alone. Sundays and public holidays are skipped.
//
// Each run covers the last BackfillDays days, not just yesterday, so days are
// still closed out after the server was down for a while. It also runs once at
// startup. Every step only fills gaps, so running again is harmless.
public sealed class AbsenceMarkerService(
    IServiceScopeFactory scopeFactory,
    ILogger<AbsenceMarkerService> logger) : BackgroundService
{
    // A few minutes past midnight so late clock-outs right at 00:00 land first.
    private static readonly TimeSpan RunAt = TimeSpan.FromMinutes(5);

    private const int BackfillDays = 14;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await RunSafelyAsync(stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            var now = AppClock.Now;
            var delay = now.Date.AddDays(1).Add(RunAt) - now;
            if (delay > TimeSpan.Zero)
                await Task.Delay(delay, stoppingToken);

            await RunSafelyAsync(stoppingToken);
        }
    }

    private async Task RunSafelyAsync(CancellationToken ct)
    {
        var yesterday = AppClock.Today.AddDays(-1);
        for (var day = yesterday.AddDays(-(BackfillDays - 1)); day <= yesterday; day = day.AddDays(1))
        {
            try
            {
                await MarkDayAsync(day, onlyStartedEmployees: day != yesterday, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                return;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to close out attendance for {Day}", day);
            }
        }
    }

    /// <param name="onlyStartedEmployees">
    /// For catch-up days: only mark employees who already have an earlier
    /// attendance record, so someone added today isn't marked absent for the
    /// days before they joined (users have no start date).
    /// </param>
    public async Task MarkDayAsync(DateOnly day, bool onlyStartedEmployees, CancellationToken ct)
    {
        if (day.DayOfWeek == DayOfWeek.Sunday)
            return;

        if (await PublicHolidaysHelper.IsHolidayAsync(day))
            return;

        using var scope = scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GSDbContext>();

        var recordedUserIds = await context.Attendances
            .Where(a => a.Date == day)
            .Select(a => a.UserId)
            .ToListAsync(ct);

        var candidates = context.Users.Where(u => u.IsActive && !recordedUserIds.Contains(u.Id));
        if (onlyStartedEmployees)
            candidates = candidates.Where(u => context.Attendances.Any(a => a.UserId == u.Id && a.Date < day));

        var absentUserIds = await candidates.Select(u => u.Id).ToListAsync(ct);

        var defaultShiftId = await context.Shifts
            .Where(s => s.IsDefault)
            .Select(s => (int?)s.Id)
            .FirstOrDefaultAsync(ct);

        context.Attendances.AddRange(absentUserIds.Select(userId => new Attendance
        {
            UserId = userId,
            Date = day,
            Status = AttendanceStatus.Absent,
            ShiftId = defaultShiftId
        }));

        var missedClockOut = await context.Attendances
            .Where(a => a.Date == day && a.CheckInTime != null && a.CheckOutTime == null && !a.MissedClockOut)
            .ToListAsync(ct);
        foreach (var attendance in missedClockOut)
            attendance.MissedClockOut = true;

        await context.SaveChangesAsync(ct);

        if (absentUserIds.Count > 0 || missedClockOut.Count > 0)
            logger.LogInformation(
                "Closed out attendance for {Day}: {Absent} marked absent, {MissedOut} missed clock-out",
                day, absentUserIds.Count, missedClockOut.Count);
    }
}
