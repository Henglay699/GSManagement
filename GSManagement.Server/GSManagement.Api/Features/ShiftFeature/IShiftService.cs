using GSManagement.Api.Features.ShiftFeature.DTOs;

namespace GSManagement.Api.Features.ShiftFeature;

public interface IShiftService
{
    Task<List<ShiftDto>> GetAllAsync();
    Task<ShiftDto?> GetByIdAsync(int id);
    Task<ShiftDto?> GetDefaultShiftAsync();
    Task<ShiftDto> CreateAsync(CreateShiftDto dto);
    Task<ShiftDto?> UpdateAsync(int id, UpdateShiftDto dto);
    Task<bool> DeleteAsync(int id);
}
