namespace GSManagement.Api.Shared.Utils;

/// <summary>
/// The company's wall clock (App:TimeZone, Asia/Phnom_Penh by default).
/// Attendance dates and clock times must use this rather than DateTime.Now,
/// which follows the server's own timezone (UTC in a container).
/// </summary>
public static class AppClock
{
    private const string DefaultZone = "Asia/Phnom_Penh";

    public static TimeZoneInfo Zone { get; private set; } = Resolve(DefaultZone);

    /// <summary>Called once at startup with the configured timezone id.</summary>
    public static void Configure(string? zoneId)
    {
        if (!string.IsNullOrWhiteSpace(zoneId)) Zone = Resolve(zoneId);
    }

    public static DateTime Now => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Zone);
    public static DateOnly Today => DateOnly.FromDateTime(Now);
    public static TimeOnly TimeOfDay => TimeOnly.FromDateTime(Now);

    // IANA ids work everywhere on .NET 6+; the Windows-id fallback covers
    // Windows machines without ICU.
    private static TimeZoneInfo Resolve(string id)
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(id);
        }
        catch (TimeZoneNotFoundException) when (TimeZoneInfo.TryConvertIanaIdToWindowsId(id, out var windowsId))
        {
            return TimeZoneInfo.FindSystemTimeZoneById(windowsId);
        }
    }
}
