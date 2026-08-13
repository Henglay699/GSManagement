using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace GSManagement.Api.Middlewares.auth;

public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    private readonly IPermissionService _permissionService;

    public PermissionAuthorizationHandler(IPermissionService permissionService)
    {
        _permissionService = permissionService;
    }


    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        // var userId = context.User.Claims.FirstOrDefault(
        //     x => x.Type == ClaimTypes.NameIdentifier)?.Value;
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(userId) || !int.TryParse(userId, out int parsedUserId))
        {
            context.Fail();
            return;
        }

        var hasPermission = await _permissionService
            .HasPermission(parsedUserId, requirement.Permission);

        if (hasPermission) context.Succeed(requirement);

    }

}
