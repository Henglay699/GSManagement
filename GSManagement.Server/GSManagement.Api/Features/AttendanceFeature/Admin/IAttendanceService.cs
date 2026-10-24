using GSManagement.Api.Features.AttendanceFeature.Admin.DTOs;

namespace GSManagement.Api.Features.AttendanceFeature.Admin;

public interface IAttendanceService
{
    Task<DailyAttendanceDto> GetDailyAsync(DateOnly date);
    Task<WeeklyAttendanceDto> GetWeeklyAsync(DateOnly anyDayInWeek);
    Task<AttendanceRecordDto?> GetByIdAsync(int id);
    Task<AttendanceRecordDto> CreateAsync(SaveAttendanceDto dto);
    Task<AttendanceRecordDto?> UpdateAsync(int id, SaveAttendanceDto dto);
    Task<bool> DeleteAsync(int id);
}
