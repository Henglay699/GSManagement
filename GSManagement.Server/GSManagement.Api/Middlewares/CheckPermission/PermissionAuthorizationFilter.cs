using GSManagement.Domain.Entities.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace JwtTest.Middlewares.CheckPermission;

// Permissions are loaded into claims once per request in
// AuthenticationConfig (OnTokenValidated), so this is just a claim lookup.
public class PermissionAuthorizationFilter(AppPermission requiredPermission) : IAsyncActionFilter
{
    private readonly AppPermission _requiredPermission = requiredPermission;

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var user = context.HttpContext.User;

        if (user.Identity?.IsAuthenticated is not true)
        {
            context.Result = new ObjectResult(new { message = "User is not authenticated." })
            {
                StatusCode = StatusCodes.Status401Unauthorized
            };
            return;
        }

        if (!user.HasClaim(UserAccessCache.PermissionClaimType, _requiredPermission.ToString()))
        {
            context.Result = new ObjectResult(new { message = "Forbidden: Missing required permission." })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
            return;
        }

        // Permission granted, proceed to controller action
        await next();
    }
}
