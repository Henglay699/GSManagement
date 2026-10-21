using GSManagement.Api.Features.ShiftFeature.DTOs;
using GSManagement.Domain.DB;
using GSManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GSManagement.Api.Features.ShiftFeature;

public class ShiftService(GSDbContext context) : IShiftService
{
    private readonly GSDbContext _context = context;

    public async Task<List<ShiftDto>> GetAllAsync()
    {
        return await _context.Shifts
            .AsNoTracking()
            .OrderBy(s => s.StartTime)
            .Select(s => new ShiftDto(s.Id, s.Name, s.StartTime, s.EndTime, s.GraceMinutes, s.IsDefault))
            .ToListAsync();
    }

    public async Task<ShiftDto?> GetByIdAsync(int id)
    {
        var shift = await _context.Shifts
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id);

        return shift is null ? null : new ShiftDto(shift.Id, shift.Name, shift.StartTime, shift.EndTime, shift.GraceMinutes, shift.IsDefault);
    }

    public async Task<ShiftDto?> GetDefaultShiftAsync()
    {
        var shift = await _context.Shifts
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.IsDefault)
            ?? await _context.Shifts.AsNoTracking().FirstOrDefaultAsync();

        return shift is null ? null : new ShiftDto(shift.Id, shift.Name, shift.StartTime, shift.EndTime, shift.GraceMinutes, shift.IsDefault);
    }

    public async Task<ShiftDto> CreateAsync(CreateShiftDto dto)
    {
        if (dto.IsDefault)
        {
            var existingDefaults = await _context.Shifts.Where(s => s.IsDefault).ToListAsync();
            foreach (var s in existingDefaults)
            {
                s.IsDefault = false;
            }
        }

        var shift = new Shift
        {
            Name = dto.Name,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            GraceMinutes = dto.GraceMinutes,
            IsDefault = dto.IsDefault
        };

        _context.Shifts.Add(shift);
        await _context.SaveChangesAsync();

        return new ShiftDto(shift.Id, shift.Name, shift.StartTime, shift.EndTime, shift.GraceMinutes, shift.IsDefault);
    }

    public async Task<ShiftDto?> UpdateAsync(int id, UpdateShiftDto dto)
    {
        var shift = await _context.Shifts.FirstOrDefaultAsync(s => s.Id == id);
        if (shift is null) return null;

        if (dto.IsDefault && !shift.IsDefault)
        {
            var existingDefaults = await _context.Shifts.Where(s => s.IsDefault && s.Id != id).ToListAsync();
            foreach (var s in existingDefaults)
            {
                s.IsDefault = false;
            }
        }

        shift.Name = dto.Name;
        shift.StartTime = dto.StartTime;
        shift.EndTime = dto.EndTime;
        shift.GraceMinutes = dto.GraceMinutes;
        shift.IsDefault = dto.IsDefault;

        await _context.SaveChangesAsync();

        return new ShiftDto(shift.Id, shift.Name, shift.StartTime, shift.EndTime, shift.GraceMinutes, shift.IsDefault);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var shift = await _context.Shifts.FirstOrDefaultAsync(s => s.Id == id);
        if (shift is null) return false;

        _context.Shifts.Remove(shift);
        await _context.SaveChangesAsync();
        return true;
    }
}
