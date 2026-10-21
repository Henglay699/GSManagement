using System.Net;

namespace GSManagement.Api.Shared.Email;

// Minimal HTML emails. Every dynamic value is HTML-encoded.
public static class EmailTemplates
{
    private static string Layout(string title, string content) => $"""
        <div style="font-family:Segoe UI,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1e293b">
          <h2 style="margin:0 0 16px;color:#4f46e5">{WebUtility.HtmlEncode(title)}</h2>
          {content}
          <p style="margin-top:32px;font-size:12px;color:#94a3b8">GS Management · Grateful Solutions Cambodia Co., Ltd</p>
        </div>
        """;

    public static (string Subject, string Html) PasswordReset(string userName, string resetUrl, int validMinutes) => (
        "Reset your password",
        Layout("Reset your password", $"""
            <p>Hi {WebUtility.HtmlEncode(userName)},</p>
            <p>We received a request to reset your password. Click the button below to choose a new one.</p>
            <p style="margin:24px 0">
              <a href="{WebUtility.HtmlEncode(resetUrl)}" style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">Reset password</a>
            </p>
            <p style="font-size:13px;color:#64748b">This link expires in {validMinutes} minutes and can only be used once.
            If you didn't ask for this, you can ignore this email; your password stays the same.</p>
            """));

    public static (string Subject, string Html) EmailChangeCode(string userName, string code, int validMinutes) => (
        $"Your verification code: {code}",
        Layout("Confirm your new email", $"""
            <p>Hi {WebUtility.HtmlEncode(userName)},</p>
            <p>Enter this code in My Profile to confirm this address as your new email:</p>
            <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0;color:#0f172a">{WebUtility.HtmlEncode(code)}</p>
            <p style="font-size:13px;color:#64748b">The code expires in {validMinutes} minutes. If you didn't request this, ignore this email.</p>
            """));

    public static (string Subject, string Html) EmailChangedNotice(string userName, string newEmail) => (
        "Your email address was changed",
        Layout("Your email address was changed", $"""
            <p>Hi {WebUtility.HtmlEncode(userName)},</p>
            <p>The email for your account was changed to <strong>{WebUtility.HtmlEncode(newEmail)}</strong>.</p>
            <p style="font-size:13px;color:#64748b">If you didn't do this, contact your administrator immediately.</p>
            """));
}
