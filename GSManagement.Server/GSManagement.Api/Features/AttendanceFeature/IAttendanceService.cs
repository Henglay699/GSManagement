using GSManagement.Api.Features.AttendanceFeature.DTOs;
using GSManagement.Domain.Entities.Enums;

namespace GSManagement.Api.Features.AttendanceFeature;

public interface IAttendanceService
{
    Task<AttendanceGridResponseDto> GetWeeklyAttendanceGridAsync(DateOnly selectedDate, AttendanceStatus? statusFilter);
    Task<AttendanceRecordDto?> GetByIdAsync(int id);
    Task<AttendanceRecordDto> CreateAsync(CreateAttendanceDto dto);
}