using GSManagement.Api.Features.AttendanceFeature.Admin;
using GSManagement.Api.Features.LeaveFeature;
using GSManagement.Api.Features.Permissionfeature;
using GSManagement.Api.Features.RoleFeature;
using GSManagement.Api.Features.UserFeature;

namespace GSManagement.Api.Extentions;

public static class ApplicationServices
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection service)
    {
        service.AddScoped<IUserService, UserService>();
        service.AddScoped<IRoleService, RoleService>();
        service.AddScoped<PermissionService>();
        service.AddScoped<IAttendanceService, AttendanceService>();
        service.AddScoped<ILeaveRequestService, LeaveRequestService>();
        return service;
    }
}
