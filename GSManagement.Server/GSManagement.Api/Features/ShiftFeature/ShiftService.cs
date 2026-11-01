using GSManagement.Api.Features.ShiftFeature.DTOs;
using GSManagement.Api.Shared.Utils;
using GSManagement.Domain.DB;
using GSManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GSManagement.Api.Features.ShiftFeature;

public class ShiftService(GSDbContext context) : IShiftService
{
    private readonly GSDbContext _context = context;

    public async Task<List<ShiftDto>> GetAllAsync()
    {
        var shifts = await _context.Shifts
            .AsNoTracking()
            .OrderBy(s => s.StartTime)
            .ToListAsync();
        var counts = await EmployeeCountsAsync(shifts);
        return shifts.Select(s => Map(s, counts.GetValueOrDefault(s.Id))).ToList();
    }

    public async Task<ShiftDto?> GetByIdAsync(int id)
    {
        var shift = await _context.Shifts
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id);

        return shift is null ? null : Map(shift, (await EmployeeCountsAsync([shift])).GetValueOrDefault(shift.Id));
    }

    public async Task<ShiftDto?> GetDefaultShiftAsync()
    {
        var shift = await _context.Shifts
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.IsDefault)
            ?? await _context.Shifts.AsNoTracking().FirstOrDefaultAsync();

        return shift is null ? null : Map(shift);
    }

    public async Task<ShiftDto> CreateAsync(CreateShiftDto dto)
    {
        Validate(dto.Name, dto.StartTime, dto.EndTime, dto.GraceMinutes);

        // The first shift becomes the default: employees without a shift need one.
        var isDefault = dto.IsDefault || !await _context.Shifts.AnyAsync();
        if (isDefault)
        {
            var existingDefaults = await _context.Shifts.Where(s => s.IsDefault).ToListAsync();
            foreach (var s in existingDefaults)
            {
                s.IsDefault = false;
            }
        }

        var shift = new Shift
        {
            Name = dto.Name.Trim(),
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            GraceMinutes = dto.GraceMinutes,
            IsDefault = isDefault
        };

        _context.Shifts.Add(shift);
        await _context.SaveChangesAsync();

        return Map(shift);
    }

    public async Task<ShiftDto?> UpdateAsync(int id, UpdateShiftDto dto)
    {
        var shift = await _context.Shifts.FirstOrDefaultAsync(s => s.Id == id);
        if (shift is null) return null;

        Validate(dto.Name, dto.StartTime, dto.EndTime, dto.GraceMinutes);
        if (shift.IsDefault && !dto.IsDefault)
            throw new InvalidOperationException(
                "There must always be a default shift. Make another shift the default instead.");

        if (dto.IsDefault && !shift.IsDefault)
        {
            var existingDefaults = await _context.Shifts.Where(s => s.IsDefault && s.Id != id).ToListAsync();
            foreach (var s in existingDefaults)
            {
                s.IsDefault = false;
            }
        }

        shift.Name = dto.Name.Trim();
        shift.StartTime = dto.StartTime;
        shift.EndTime = dto.EndTime;
        shift.GraceMinutes = dto.GraceMinutes;
        shift.IsDefault = dto.IsDefault;

        await _context.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var shift = await _context.Shifts.FirstOrDefaultAsync(s => s.Id == id);
        if (shift is null) return false;
        if (shift.IsDefault)
            throw new InvalidOperationException("The default shift can't be deleted. Make another shift the default first.");

        // Its employees go back to the default shift (the foreign key is set to null).
        _context.Shifts.Remove(shift);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<ShiftAssignmentDto>> GetAssignmentsAsync()
    {
        var defaultId = await DefaultShiftIdAsync();
        var users = await _context.Users
            .AsNoTracking()
            .Where(u => u.IsActive)
            .OrderBy(u => u.UserName)
            .Select(u => new { u.Id, u.UserName, u.Email, u.ImageUrl, u.ShiftId, Roles = u.Roles.Select(r => r.RoleName).ToList() })
            .ToListAsync();

        return users
            .Select(u => new ShiftAssignmentDto(
                u.Id, u.UserName, u.Email, u.ImageUrl, string.Join(", ", u.Roles), u.ShiftId ?? defaultId))
            .ToList();
    }

    /// <summary>
    /// Makes <paramref name="dto"/>'s employees the ones working the shift. Anyone
    /// left out of a non-default shift goes back to the default shift; the default
    /// shift can only gain people (move someone off it by assigning another shift).
    /// Days from today that aren't clocked in yet follow the change.
    /// </summary>
    public async Task<List<ShiftAssignmentDto>?> AssignEmployeesAsync(int id, AssignShiftEmployeesDto dto)
    {
        var shift = await _context.Shifts.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
        if (shift is null) return null;

        var defaultId = await DefaultShiftIdAsync();
        var wanted = dto.UserIds.Distinct().ToHashSet();
        // The default shift is stored as "no shift", so it follows whichever shift is default.
        int? stored = shift.IsDefault ? null : shift.Id;

        var users = await _context.Users
            .Where(u => u.IsActive && (wanted.Contains(u.Id) || u.ShiftId == shift.Id || (shift.IsDefault && u.ShiftId == null)))
            .ToListAsync();
        if (users.Count(u => wanted.Contains(u.Id)) != wanted.Count)
            throw new InvalidOperationException("One or more employees were not found or are inactive.");

        var changed = new Dictionary<int, int?>();
        foreach (var user in users)
        {
            var next = wanted.Contains(user.Id) ? stored
                : shift.IsDefault ? user.ShiftId
                : null;
            if (next == user.ShiftId) continue;
            user.ShiftId = next;
            changed[user.Id] = next ?? defaultId;
        }

        if (changed.Count > 0)
        {
            // Leave days and other records from today on that have no clock-in yet.
            var ids = changed.Keys.ToList();
            var upcoming = await _context.Attendances
                .Where(a => ids.Contains(a.UserId) && a.Date >= AppClock.Today && a.CheckInTime == null)
                .ToListAsync();
            foreach (var a in upcoming)
                a.ShiftId = changed[a.UserId];
        }

        await _context.SaveChangesAsync();
        return await GetAssignmentsAsync();
    }

    private static void Validate(string name, TimeOnly start, TimeOnly end, int grace)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new InvalidOperationException("Give the shift a name.");
        if (end == start)
            throw new InvalidOperationException("The shift must end at a different time than it starts.");
        // An end at or before the start is an overnight shift ending the next morning.
        var length = (end - start).TotalMinutes;
        if (length <= 0) length += 24 * 60;
        if (grace < 0 || grace >= length)
            throw new InvalidOperationException("The grace period must be at least 0 and shorter than the shift.");
    }

    private async Task<int?> DefaultShiftIdAsync() =>
        await _context.Shifts.Where(s => s.IsDefault).Select(s => (int?)s.Id).FirstOrDefaultAsync()
        ?? await _context.Shifts.OrderBy(s => s.Id).Select(s => (int?)s.Id).FirstOrDefaultAsync();

    // Active employees per shift; those with no shift count toward the default.
    private async Task<Dictionary<int, int>> EmployeeCountsAsync(IReadOnlyCollection<Shift> shifts)
    {
        var defaultId = await DefaultShiftIdAsync();
        var perShift = await _context.Users
            .Where(u => u.IsActive)
            .GroupBy(u => u.ShiftId)
            .Select(g => new { ShiftId = g.Key, Count = g.Count() })
            .ToListAsync();
        return shifts.ToDictionary(
            s => s.Id,
            s => perShift.Where(p => p.ShiftId == s.Id || (p.ShiftId == null && s.Id == defaultId)).Sum(p => p.Count));
    }

    private static ShiftDto Map(Shift s, int employeeCount = 0) =>
        new(s.Id, s.Name, s.StartTime, s.EndTime, s.GraceMinutes, s.IsDefault, employeeCount);
}
