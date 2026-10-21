using System.Security.Cryptography;
using System.Text;
using GSManagement.Api.Features.UserFeature;
using GSManagement.Api.Hubs;
using GSManagement.Api.Shared.Email;
using GSManagement.Api.Shared.Models;
using GSManagement.Domain.DB;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace GSManagement.Api.Features.Profile;

// Self-service email change: the user proves they know their password, then
// proves they own the new address by entering a code sent to it.
// Pending codes live in memory: an API restart just means requesting a new code.
public class EmailChangeService(
    GSDbContext context,
    IMemoryCache cache,
    IEmailSender emailSender,
    IHubContext<UserHub> hubContext,
    IUserService userService,
    ILogger<EmailChangeService> logger)
{
    private const int CodeValidMinutes = 15;
    private const int MaxAttempts = 5;

    private sealed class PendingChange
    {
        public required string NewEmail { get; init; }
        public required string CodeHash { get; init; }
        public int FailedAttempts { get; set; }
    }

    private static string Key(int userId) => $"email-change:{userId}";
    private static string Hash(string code) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(code)));

    public async Task<Result<bool>> RequestAsync(int userId, string newEmail, string currentPassword, CancellationToken ct)
    {
        // At most one code per user per minute, to stop inbox flooding.
        var throttleKey = $"email-change-throttle:{userId}";
        if (cache.TryGetValue(throttleKey, out _))
            return Result<bool>.Fail("Please wait before requesting another code.", ErrorType.Validation);
        cache.Set(throttleKey, true, TimeSpan.FromMinutes(1));

        var normalized = newEmail.Trim().ToLower();

        var user = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user == null)
            return Result<bool>.Fail("User not found.", ErrorType.NotFound);

        // Trimmed like login and the other password paths.
        if (!BCrypt.Net.BCrypt.Verify(currentPassword.Trim(), user.PasswordHash))
            return Result<bool>.Fail("Current password is incorrect.", ErrorType.Validation);
        if (normalized == user.Email)
            return Result<bool>.Fail("That is already your email address.", ErrorType.Validation);
        if (await context.Users.AnyAsync(u => u.Id != userId && u.Email == normalized, ct))
            return Result<bool>.Fail("That email is already used by another account.", ErrorType.Conflict);

        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        cache.Set(Key(userId),
            new PendingChange { NewEmail = normalized, CodeHash = Hash(code) },
            TimeSpan.FromMinutes(CodeValidMinutes));

        var (subject, html) = EmailTemplates.EmailChangeCode(user.UserName, code, CodeValidMinutes);
        try
        {
            await emailSender.SendAsync(normalized, subject, html, ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email-change code for user {UserId}", userId);
            cache.Remove(Key(userId));
            return Result<bool>.Fail("We couldn't send the verification email. Please try again later.", ErrorType.Validation);
        }
        return Result<bool>.Success(true);
    }

    public async Task<Result<string>> ConfirmAsync(int userId, string code, CancellationToken ct)
    {
        const string noRequest = "No pending email change, or the code has expired. Please request a new code.";
        if (!cache.TryGetValue(Key(userId), out PendingChange? pending) || pending is null)
            return Result<string>.Fail(noRequest, ErrorType.Validation);

        var codeMatches = CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(Hash(code.Trim())),
            Encoding.UTF8.GetBytes(pending.CodeHash));
        if (!codeMatches)
        {
            // Stop guessing: 5 wrong tries throws the code away.
            if (++pending.FailedAttempts >= MaxAttempts)
            {
                cache.Remove(Key(userId));
                return Result<string>.Fail("Too many wrong codes. Please request a new one.", ErrorType.Validation);
            }
            return Result<string>.Fail("That code is incorrect.", ErrorType.Validation);
        }

        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user == null)
            return Result<string>.Fail("User not found.", ErrorType.NotFound);
        // Someone may have taken the address while the code was pending.
        if (await context.Users.AnyAsync(u => u.Id != userId && u.Email == pending.NewEmail, ct))
            return Result<string>.Fail("That email is already used by another account.", ErrorType.Conflict);

        var oldEmail = user.Email;
        user.Email = pending.NewEmail;
        await context.SaveChangesAsync(ct);
        cache.Remove(Key(userId));

        // Tell the old address, in case this wasn't the account owner.
        var (subject, html) = EmailTemplates.EmailChangedNotice(user.UserName, user.Email);
        try { await emailSender.SendAsync(oldEmail, subject, html, ct); }
        catch (Exception ex) { logger.LogError(ex, "Failed to send email-changed notice for user {UserId}", userId); }

        // Same payload UserService broadcasts, so open user lists refresh.
        var updated = await userService.GetUserByIdAsync(userId, ct);
        if (updated.IsSuccess)
            await hubContext.Clients.All.SendAsync("UserUpdated", updated.Value, ct);
        return Result<string>.Success(user.Email);
    }
}
