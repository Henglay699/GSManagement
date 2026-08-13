using GSManagement.Api.Features.RoleFeature;
using GSManagement.Api.Features.UserFeature;

namespace GSManagement.Api.Extentions;

public static class ApplicationServices
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection service)
    {
        service.AddScoped<IUserService, UserService>();
        service.AddScoped<IRoleService, RoleService>();
        return service;
    }
}
