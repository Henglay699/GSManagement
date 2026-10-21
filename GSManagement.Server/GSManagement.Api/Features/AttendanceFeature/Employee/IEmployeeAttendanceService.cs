using GSManagement.Api.Features.AttendanceFeature.Employee.DTOs;

namespace GSManagement.Api.Features.AttendanceFeature.Employee;

public interface IEmployeeAttendanceService
{
    Task<ClockResultDto> ClockInAsync(int userId);
    Task<ClockResultDto> ClockOutAsync(int userId);
    Task<EmployeeTodayStatusDto> GetTodayStatusAsync(int userId);
    Task<EmployeeMonthlySummaryDto> GetMonthlySummaryAsync(int userId, int year, int month);
}
