using GSManagement.Api.Features.Auth.DTOs;
using GSManagement.Api.Shared.Email;
using GSManagement.Api.Shared.Models;
using GSManagement.Api.Shared.Utils;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Caching.Memory;
using GSManagement.Domain.DB;
using GSManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace GSManagement.Api.Features.Auth;

public class AuthService(
    GSDbContext _context,
    IConfiguration _config,
    IDataProtectionProvider dataProtection,
    IBackgroundEmailQueue emailQueue,
    IMemoryCache cache) : IAuthService
{
    private const int ResetLinkValidMinutes = 30;
    // Verified against when the email doesn't exist, so a wrong email takes as long
    // as a wrong password and response times don't reveal which emails are registered.
    private static readonly string DummyPasswordHash = BCrypt.Net.BCrypt.HashPassword("dummy-password");

    public async Task<AuthResponeDto> LoginAsync(AuthRequestDto login)
    {
        var toLowerCaseEmail = login.Email.Trim().ToLower();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == toLowerCaseEmail);
        var passwordValid = BCrypt.Net.BCrypt.Verify(login.Password.Trim(), user?.PasswordHash ?? DummyPasswordHash);
        if (user == null || !passwordValid)
            throw new UnauthorizedAccessException("Invalid email or password");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("User is not active");
        return await CreateTokenReponse(user, login.DeviceId);
    }

    private const int RefreshTokenSlidingDays = 7;
    private const int SessionAbsoluteDays = 30;

    private async Task<AuthResponeDto> CreateTokenReponse(User user, string deviceId)
    {
        int expiresInMinutes = int.Parse(_config["Jwt:ExpirationInMinutes"]!);
        return new AuthResponeDto(
            GenerateJwtToken(user),
            await GenerateAndSaveRefreshToken(user, deviceId),
            expiresInMinutes);
    }

    private string GenerateJwtToken(User user)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, user.UserName),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString())
        };
        //foreach (var role in user.Roles.Select(r => r.RoleName).ToList())
        //{
        //    claims.Add(new Claim(ClaimTypes.Role, role));
        //}
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
                        issuer: _config["Jwt:Issuer"],
                        audience: _config["Jwt:Audience"],
                        claims: claims,
                        expires: DateTime.UtcNow.AddMinutes(int.Parse(_config["Jwt:ExpirationInMinutes"]!)),
                        signingCredentials: creds
                    );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    // Login starts a new session (resets the absolute expiry);
    // refresh rotates the token inside the existing session.
    private async Task<string> GenerateAndSaveRefreshToken(User user, string deviceId, RefreshToken? session = null)
    {
        var refreshToken = GenerateRefreshToken();
        var now = DateTime.UtcNow;

        if (session != null)
        {
            session.PreviousToken = session.Token;
            session.Token = RefreshTokenHasher.Hash(refreshToken);
            session.ExpireDate = Min(now.AddDays(RefreshTokenSlidingDays), session.SessionExpireDate);
            await _context.SaveChangesAsync();
            return refreshToken;
        }

        var sessionExpireDate = now.AddDays(SessionAbsoluteDays);
        var existToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.UserId == user.Id && rt.DeviceId == deviceId);
        if (existToken != null)
        {
            existToken.Token = RefreshTokenHasher.Hash(refreshToken);
            // The column is NOT NULL; an empty string never matches a token hash.
            existToken.PreviousToken = string.Empty;
            existToken.IsInVoked = false;
            existToken.ExpireDate = now.AddDays(RefreshTokenSlidingDays);
            existToken.SessionExpireDate = sessionExpireDate;
        }
        else
        {
            var newRefreshToken = new RefreshToken
            {
                UserId = user.Id,
                Token = RefreshTokenHasher.Hash(refreshToken),
                DeviceId = deviceId,
                IsInVoked = false,
                ExpireDate = now.AddDays(RefreshTokenSlidingDays),
                SessionExpireDate = sessionExpireDate
            };
            _context.RefreshTokens.Add(newRefreshToken);
        }

        await _context.SaveChangesAsync();
        return refreshToken;
    }

    private static DateTime Min(DateTime a, DateTime b) => a < b ? a : b;

    // Looked up by the token hash + deviceId, so the client never has to send
    // UserId. Nothing sensitive needs to travel outside the HttpOnly cookie.
    public async Task<AuthResponeDto?> RefreshTokenAsync(string refreshToken, string deviceId)
    {
        var tokenHash = RefreshTokenHasher.Hash(refreshToken);
        var storeToken = await _context.RefreshTokens
                        .Include(rt => rt.User)
                        .FirstOrDefaultAsync(rt => rt.DeviceId == deviceId
                            && (rt.Token == tokenHash || rt.PreviousToken == tokenHash));

        if (storeToken is null)
            return null;

        // A rotated-out token was presented again: either it was stolen or
        // the client replayed it. Kill the whole session for this device.
        if (storeToken.Token != tokenHash)
        {
            storeToken.IsInVoked = true;
            await _context.SaveChangesAsync();
            return null;
        }

        var now = DateTime.UtcNow;
        if (storeToken.IsInVoked || storeToken.ExpireDate <= now || storeToken.SessionExpireDate <= now)
            return null;

        if (storeToken.User is not { IsActive: true })
            return null;

        return new AuthResponeDto(
            GenerateJwtToken(storeToken.User),
            await GenerateAndSaveRefreshToken(storeToken.User, deviceId, storeToken),
            int.Parse(_config["Jwt:ExpirationInMinutes"]!));
    }

    public async Task<CurrentUserDto?> GetCurrentUserAsync(int userId, CancellationToken ct)
    {
        var user = await _context.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new
            {
                u.Id,
                u.UserName,
                u.Email,
                u.ImageUrl,
                Roles = u.Roles.Select(r => r.RoleName).ToList(),
                Permissions = u.Roles.SelectMany(r => r.Permissions).Select(p => p.PermissionName).ToList()
            })
            .FirstOrDefaultAsync(ct);

        // Distinct/ToString in memory: EF can't translate them inside this subquery.
        return user is null
            ? null
            : new CurrentUserDto(
                user.Id,
                user.UserName,
                user.Email,
                user.ImageUrl,
                user.Roles,
                user.Permissions.Distinct().Select(p => p.ToString()).ToList());
    }

    // ---- Forgot / reset password ----

    private ITimeLimitedDataProtector ResetProtector =>
        dataProtection.CreateProtector("PasswordReset.v1").ToTimeLimitedDataProtector();

    // Changes whenever the password changes, so a reset link stops working
    // once it has been used (or the password was changed some other way).
    private static string PasswordStamp(string passwordHash) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(passwordHash)))[..16];

    // Always "succeeds" from the caller's point of view, so the response never
    // reveals whether an email is registered.
    private static readonly TimeSpan ThrottleWindow = TimeSpan.FromMinutes(1);

    /// <summary>
    /// Returns the number of seconds the caller must wait before the next
    /// request is accepted. 0 means the email was (or would have been) sent.
    /// </summary>
    public async Task<int> RequestPasswordResetAsync(string email)
    {
        var normalized = email.Trim().ToLower();

        // At most one email per address per minute, to stop inbox flooding.
        var throttleKey = $"pw-reset-throttle:{normalized}";
        if (cache.TryGetValue(throttleKey, out DateTimeOffset expiresAt))
        {
            var remaining = (int)Math.Ceiling((expiresAt - DateTimeOffset.UtcNow).TotalSeconds);
            return Math.Max(remaining, 1);
        }

        var deadline = DateTimeOffset.UtcNow.Add(ThrottleWindow);
        cache.Set(throttleKey, deadline, ThrottleWindow);

        var user = await _context.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == normalized);
        if (user is not { IsActive: true })
            return 0;

        var token = ResetProtector.Protect(
            $"{user.Id}:{PasswordStamp(user.PasswordHash)}",
            TimeSpan.FromMinutes(ResetLinkValidMinutes));
        var frontendUrl = (_config["App:FrontendUrl"] ?? "http://localhost:5173").TrimEnd('/');
        var resetUrl = $"{frontendUrl}/reset-password?token={Uri.EscapeDataString(token)}";
        var (subject, html) = EmailTemplates.PasswordReset(user.UserName, resetUrl, ResetLinkValidMinutes);

        // Enqueued for the BackgroundEmailService: awaiting it inline would
        // make requests for real accounts measurably slower than for unknown emails.
        emailQueue.Enqueue(user.Email, subject, html);
        return 0;
    }

    public async Task<Result<bool>> ResetPasswordAsync(string token, string newPassword)
    {
        const string invalidLink = "This reset link is invalid or has expired. Please request a new one.";
        if (string.IsNullOrWhiteSpace(newPassword))
            return Result<bool>.Fail("New password is required.", ErrorType.Validation);

        string payload;
        try
        {
            payload = ResetProtector.Unprotect(token);
        }
        catch (CryptographicException)
        {
            // Tampered, expired, or signed with keys this server doesn't have.
            return Result<bool>.Fail(invalidLink, ErrorType.Validation);
        }

        var parts = payload.Split(':');
        if (parts.Length != 2 || !int.TryParse(parts[0], out var userId))
            return Result<bool>.Fail(invalidLink, ErrorType.Validation);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is not { IsActive: true } || PasswordStamp(user.PasswordHash) != parts[1])
            return Result<bool>.Fail(invalidLink, ErrorType.Validation);

        // Trimmed like login and the other password paths.
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword.Trim());

        // Whoever might have had the old password loses their sessions too.
        await _context.RefreshTokens
            .Where(rt => rt.UserId == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(rt => rt.IsInVoked, true));
        await _context.SaveChangesAsync();
        return Result<bool>.Success(true);
    }

    public async Task RevokeRefreshTokenAsync(string refreshToken, string deviceId)
    {
        var tokenHash = RefreshTokenHasher.Hash(refreshToken);
        var token = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == tokenHash && rt.DeviceId == deviceId);

        if (token != null)
        {
            token.IsInVoked = true;
            await _context.SaveChangesAsync();
        }
    }
}
