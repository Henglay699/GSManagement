using System.Security.Claims;
using GSManagement.Api.Features.Auth.DTOs;
using JwtTest.Middlewares.CSRF;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace GSManagement.Api.Features.Auth;

[Route("api/[controller]")]
[ApiController]
public class AuthController(
    IAuthService authService,
    IAntiforgery antiforgery,
    IOptionsMonitor<JwtBearerOptions> jwtOptions,
    IWebHostEnvironment environment) : ControllerBase
{
    private const string DeviceIdHeader = "X-Device-Id";

    // Refresh cookie is only sent to this controller's endpoints, not every API call.
    // Cookie paths are case-sensitive, so the frontend must call /api/Auth/...
    private const string RefreshCookiePath = "/api/Auth";

    // In development the app is also opened over plain http (e.g. from the LAN IP),
    // where browsers drop Secure cookies. Production must be served over https.
    private bool SecureCookies => !environment.IsDevelopment();

    [HttpPost("Login")]
    [AllowAnonymous]
    [SkipAntiforgery]
    public async Task<IActionResult> Login([FromBody] AuthRequestDto login)
    {
        try
        {
            var result = await authService.LoginAsync(login);
            SetAuthCookies(result);
            var csrfToken = await IssueCsrfTokenForAsync(result.AccesToken);
            return Ok(new { accessTokenExpiresInMinutes = result.ExpiresInMinutes, csrf_token = csrfToken });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost("RefreshToken")]
    [AllowAnonymous]
    [SkipAntiforgery]
    public async Task<IActionResult> RefreshToken()
    {
        var deviceId = Request.Headers[DeviceIdHeader].ToString();
        if (!Request.Cookies.TryGetValue("refresh_token", out var refreshToken) || string.IsNullOrEmpty(deviceId))
            return Unauthorized(new { message = "Missing refresh token or device id" });

        var result = await authService.RefreshTokenAsync(refreshToken, deviceId);
        if (result is null)
        {
            ClearAuthCookies();
            return Unauthorized(new { message = "Invalid Refresh Token or Device Id" });
        }

        SetAuthCookies(result);
        var csrfToken = await IssueCsrfTokenForAsync(result.AccesToken);
        return Ok(new { accessTokenExpiresInMinutes = result.ExpiresInMinutes, csrf_token = csrfToken });
    }

    // Anonymous so logout still works after the access token has expired: the session
    // is identified by the refresh cookie. No CSRF check, since the CSRF token is bound
    // to the access token's user; the worst a forged request can do is log you out,
    // and the SameSite=Lax cookies already block that cross-site.
    [HttpPost("Logout")]
    [AllowAnonymous]
    [SkipAntiforgery]
    public async Task<IActionResult> Logout()
    {
        if (Request.Cookies.TryGetValue("refresh_token", out var refreshToken) && !string.IsNullOrEmpty(refreshToken))
        {
            await authService.RevokeRefreshTokenAsync(refreshToken, Request.Headers[DeviceIdHeader].ToString());
        }

        ClearAuthCookies();
        return Ok(new { message = "Logged out successfully" });
    }

    // Same response whether or not the email exists, so this can't be used to
    // find out which emails are registered.
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [SkipAntiforgery]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var retryAfter = await authService.RequestPasswordResetAsync(request.Email);
        if (retryAfter > 0)
        {
            return Ok(new
            {
                message = $"Please wait {retryAfter} seconds before requesting another reset email.",
                retryAfterSeconds = retryAfter
            });
        }

        return Ok(new
        {
            message = "If an account exists for that email, a reset link has been sent.",
            retryAfterSeconds = 0
        });
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    [SkipAntiforgery]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var result = await authService.ResetPasswordAsync(request.Token, request.NewPassword);
        return result.IsSuccess
            ? Ok(new { message = "Your password has been reset. You can now sign in." })
            : BadRequest(new { error = result.ErrorMessage });
    }

    // The logged-in user's profile and permissions, for the frontend to show
    // their name/photo and hide what they can't access.
    [HttpGet("me")]
    public async Task<ActionResult<CurrentUserDto>> Me(CancellationToken ct)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return Unauthorized();

        var user = await authService.GetCurrentUserAsync(userId, ct);
        return user is null ? Unauthorized() : Ok(user);
    }

    // Antiforgery tokens are bound to the current user. During Login/Refresh the
    // request is still anonymous (the new access_token cookie only arrives on the
    // next request), so a token generated now would be rejected on later requests as
    // "meant for a different user". Validate the freshly issued JWT through the
    // same JwtBearer handler/parameters used on later requests and set that as
    // HttpContext.User, so the claims match exactly.
    private async Task<string?> IssueCsrfTokenForAsync(string accessToken)
    {
        var options = jwtOptions.Get(JwtBearerDefaults.AuthenticationScheme);
        foreach (var handler in options.TokenHandlers)
        {
            var validation = await handler.ValidateTokenAsync(accessToken, options.TokenValidationParameters);
            if (validation.IsValid)
            {
                HttpContext.User = new ClaimsPrincipal(validation.ClaimsIdentity);
                break;
            }
        }

        return antiforgery.GetAndStoreTokens(HttpContext).RequestToken;
    }

    private void SetAuthCookies(AuthResponeDto result)
    {
        Response.Cookies.Append("access_token", result.AccesToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = SecureCookies,
            SameSite = SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddMinutes(result.ExpiresInMinutes),
            MaxAge = TimeSpan.FromMinutes(result.ExpiresInMinutes),
            Path = "/"
        });

        // Remove the refresh cookie from its old Path=/ location (before the path was narrowed),
        // otherwise the browser would send two refresh_token cookies to the refresh endpoint.
        Response.Cookies.Delete("refresh_token", new CookieOptions { Path = "/", Secure = SecureCookies, SameSite = SameSiteMode.Lax });

        Response.Cookies.Append("refresh_token", result.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = SecureCookies,
            SameSite = SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddDays(7),
            MaxAge = TimeSpan.FromDays(7),
            Path = RefreshCookiePath
        });
    }

    private void ClearAuthCookies()
    {
        Response.Cookies.Delete("access_token", new CookieOptions { Path = "/", Secure = SecureCookies, SameSite = SameSiteMode.Lax });
        Response.Cookies.Delete("refresh_token", new CookieOptions { Path = RefreshCookiePath, Secure = SecureCookies, SameSite = SameSiteMode.Lax });
        Response.Cookies.Delete("refresh_token", new CookieOptions { Path = "/", Secure = SecureCookies, SameSite = SameSiteMode.Lax });
    }
}
