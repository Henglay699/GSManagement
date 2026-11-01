using GSManagement.Domain.DB;
using GSManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GSManagement.Api.Features.AttendanceFeature;

/// <summary>
/// Which shift an employee works: the one assigned to them, else the default
/// shift (or the first one when none is marked default). Each attendance
/// record keeps the shift it was scored against, so changing someone's shift
/// doesn't rewrite the days they already worked.
/// </summary>
public static class EmployeeShifts
{
    public static async Task<Shift?> DefaultAsync(GSDbContext context, CancellationToken ct = default) =>
        await context.Shifts.AsNoTracking().FirstOrDefaultAsync(s => s.IsDefault, ct)
        ?? await context.Shifts.AsNoTracking().OrderBy(s => s.Id).FirstOrDefaultAsync(ct);

    public static async Task<Shift?> ForUserAsync(GSDbContext context, int userId, CancellationToken ct = default) =>
        await context.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => u.Shift)
            .FirstOrDefaultAsync(ct)
        ?? await DefaultAsync(context, ct);

    /// <summary>Each employee's shift, for the given users.</summary>
    public static async Task<Dictionary<int, Shift?>> ForUsersAsync(
        GSDbContext context, IReadOnlyCollection<int> userIds, CancellationToken ct = default)
    {
        var fallback = await DefaultAsync(context, ct);
        var assigned = await context.Users.AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new { u.Id, u.Shift })
            .ToListAsync(ct);
        return assigned.ToDictionary(u => u.Id, u => u.Shift ?? fallback);
    }
}
