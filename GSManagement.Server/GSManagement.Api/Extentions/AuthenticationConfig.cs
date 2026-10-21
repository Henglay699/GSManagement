using System.Security.Claims;
using System.Text;
using GSManagement.Domain.DB;
using JwtTest.Middlewares.CheckPermission;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;

namespace GSManagement.Api.Extentions;

public static class AuthenticationConfig
{
    public static IServiceCollection AddJwtAuthServices(this IServiceCollection services, IConfiguration _config)
    {
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer = _config["Jwt:Issuer"],
                ValidAudience = _config["Jwt:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(
                                       Encoding.UTF8.GetBytes(_config["Jwt:Key"]!)),
                ClockSkew = TimeSpan.Zero
            };
            options.Events = new JwtBearerEvents
            {
                // NEW: this runs first, before validation even starts. Without it,
                // the handler only looks at the "Authorization" header, finds
                // nothing (since the token is in a cookie now), and every request
                // fails auth with no token ever being validated.
                OnMessageReceived = ctx =>
                {
                    if (ctx.Request.Cookies.TryGetValue("access_token", out var token))
                    {
                        ctx.Token = token;
                    }
                    return Task.CompletedTask;
                },

                // Runs after the token is validated: load the user's permissions
                // (cached) into claims, so HasPermission doesn't query the database.
                OnTokenValidated = async ctx =>
                {
                    if (ctx.Principal?.Identity is not ClaimsIdentity identity
                        || !int.TryParse(identity.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId))
                    {
                        ctx.Fail("Missing or invalid user id claim.");
                        return;
                    }

                    var db = ctx.HttpContext.RequestServices.GetRequiredService<GSDbContext>();
                    var accessCache = ctx.HttpContext.RequestServices.GetRequiredService<UserAccessCache>();
                    var access = await accessCache.GetAsync(userId, db, ctx.HttpContext.RequestAborted);

                    // Deleted or deactivated users lose access right away, even with a valid token.
                    if (access is not { IsActive: true })
                    {
                        ctx.Fail("User is inactive or no longer exists.");
                        return;
                    }

                    foreach (var permission in access.Permissions)
                        identity.AddClaim(new Claim(UserAccessCache.PermissionClaimType, permission));
                }
            };
        });

        services.AddSingleton<UserAccessCache>();

        // Every endpoint requires a logged-in user unless it opts out with [AllowAnonymous].
        services.AddAuthorization(options =>
        {
            options.FallbackPolicy = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .Build();
        });
        return services;
    }
}

