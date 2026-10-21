using GSManagement.Api.Features.AttendanceFeature;
using GSManagement.Api.Features.AttendanceFeature.Admin;
using GSManagement.Api.Features.AttendanceFeature.Employee;
using GSManagement.Api.Features.Auth;
using GSManagement.Api.Features.LeaveFeature;
using GSManagement.Api.Features.Permissionfeature;
using GSManagement.Api.Features.Profile;
using GSManagement.Api.Features.RoleFeature;
using GSManagement.Api.Features.ShiftFeature;
using GSManagement.Api.Features.UserFeature;
using GSManagement.Api.Shared.Email;
using GSManagement.Api.Shared.Storage;
using JwtTest.Middlewares.CSRF;

namespace GSManagement.Api.Extentions;

public static class ApplicationServices
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection service, IHostEnvironment environment)
    {
        service.AddAntiforgery(options =>
        {
            options.HeaderName = "XSRF-TOKEN";
            // The frontend sends the request token returned by Login/Refresh,
            // so JavaScript never needs to read this cookie.
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = SameSiteMode.Lax;
            // In development the app is also opened over plain http (e.g. from the LAN IP),
            // where browsers drop Secure cookies. Must match the auth cookies in AuthController.
            options.Cookie.SecurePolicy = environment.IsDevelopment()
                ? CookieSecurePolicy.None
                : CookieSecurePolicy.Always;
            // options.Cookie.Expiration = TimeSpan.FromMinutes(int.Parse(builder.Configuration["Jwt:ExpirationInMinutes"] ?? "15"));
        });
        service.AddScoped<ValidateAntiForgeryTokenFilter>();

        service.AddScoped<IAuthService, AuthService>();
        service.AddScoped<IUserService, UserService>();
        service.AddScoped<IRoleService, RoleService>();
        service.AddScoped<PermissionService>();
        service.AddScoped<IAttendanceService, AttendanceService>();
        service.AddScoped<IEmployeeAttendanceService, EmployeeAttendanceService>();
        service.AddScoped<IShiftService, ShiftService>();
        service.AddScoped<ILeaveRequestService, LeaveRequestService>();
        service.AddScoped<LeaveNotifier>();
        service.AddSingleton<IFileStorage, R2FileStorage>();
        service.AddSingleton<IEmailSender, SmtpEmailSender>();
        service.AddSingleton<BackgroundEmailQueue>();
        service.AddSingleton<IBackgroundEmailQueue>(sp => sp.GetRequiredService<BackgroundEmailQueue>());
        service.AddHostedService<BackgroundEmailService>();
        service.AddHostedService<AbsenceMarkerService>();
        service.AddScoped<EmailChangeService>();
        return service;
    }
}
