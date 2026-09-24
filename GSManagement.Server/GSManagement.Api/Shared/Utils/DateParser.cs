namespace GSManagement.Api.Shared.Utils;

public static class DateParser
{
    public static bool TryParseMonth(string? month, out int year, out int monthNumber)
    {
        year = 0;
        monthNumber = 0;

        if (string.IsNullOrWhiteSpace(month))
        {
            return false;
        }

        var parts = month.Split('-');
        if (parts.Length != 2)
        {
            return false;
        }

        return int.TryParse(parts[0], out year)
            && int.TryParse(parts[1], out monthNumber)
            && monthNumber is >= 1 and <= 12;
    }

    public static string? FormatTime(TimeOnly? time)
    {
        return time?.ToString("hh:mm tt");
    }
}

