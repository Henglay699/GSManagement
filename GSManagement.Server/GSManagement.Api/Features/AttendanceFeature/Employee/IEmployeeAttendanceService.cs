using GSManagement.Api.Features.AttendanceFeature.Employee.DTOs;

namespace GSManagement.Api.Features.AttendanceFeature.Employee;

public interface IEmployeeAttendanceService
{
    Task<ClockResultDto> ClockInAsync(int userId);
    Task<ClockResultDto> ClockOutAsync(int userId);
    Task<EmployeeTodayDto> GetTodayAsync(int userId);
}
