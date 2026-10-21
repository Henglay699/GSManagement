using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace JwtTest.Middlewares.CSRF;

// Registered globally in Program.cs, so every unsafe request (POST/PUT/DELETE...)
// must carry the CSRF token, except actions marked [SkipAntiforgery].
public class ValidateAntiForgeryTokenFilter(IAntiforgery antiforgery) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var request = context.HttpContext.Request;
        var method = request.Method;

        // Skip safe HTTP methods
        if (HttpMethods.IsGet(method) || HttpMethods.IsHead(method) || HttpMethods.IsOptions(method) || HttpMethods.IsTrace(method))
        {
            await next();
            return;
        }

        // CSRF only works by abusing cookies the browser sends automatically. Requests
        // without the auth cookie (e.g. a mobile app or Swagger sending a Bearer header)
        // can't be forged that way, so they don't need the token.
        if (!request.Cookies.ContainsKey("access_token")
            || context.ActionDescriptor.EndpointMetadata.OfType<SkipAntiforgeryAttribute>().Any())
        {
            await next();
            return;
        }

        try
        {
            await antiforgery.ValidateRequestAsync(context.HttpContext);
        }
        catch (AntiforgeryValidationException)
        {
            context.Result = new ObjectResult(new { message = "Invalid anti-forgery token" })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
            return;
        }

        await next();
    }
}