namespace GSManagement.Api.Shared.Email;

public class SmtpOptions
{
    public const string SectionName = "Smtp";

    // e.g. smtp.gmail.com
    public string Host { get; set; } = string.Empty;
    // 587 = STARTTLS (Gmail), 465 = implicit TLS
    public int Port { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    // For Gmail: an App Password, not the account password.
    public string Password { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = "GS Management";

    public bool IsConfigured => !string.IsNullOrWhiteSpace(Host);
}
