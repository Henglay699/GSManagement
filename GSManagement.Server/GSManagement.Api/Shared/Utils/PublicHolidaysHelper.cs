using System.Collections.Concurrent;
using System.Net.Http.Json;
using GSManagement.Api.Shared.Models;

namespace GSManagement.Api.Shared.Utils;

public static class PublicHolidaysHelper
{
    private static readonly HttpClient _httpClient = new();

    // Thread-safe cache to store holidays by year
    private static readonly ConcurrentDictionary<int, List<Holiday>> _holidaysCache = new();

    public static async Task<List<Holiday>> GetHolidaysAsync(int year)
    {
        // Return a fresh copy from cache if available so caller mutations don't corrupt cache
        if (_holidaysCache.TryGetValue(year, out var cachedHolidays))
        {
            return new List<Holiday>(cachedHolidays);
        }

        var url = $"https://khmer-public-holidays-api.vercel.app/holidays?year={year}";

        try
        {
            var Holidays = await _httpClient.GetFromJsonAsync<List<KhmerHolidayDto>>(url);

            if (Holidays == null) return new List<Holiday>();

            var holidays = Holidays.ConvertAll(h => new Holiday
            {
                Date = h.Date,
                KhmerName = h.Name_Kh ?? "Unknown",
                EnglishName = h.Name_En ?? "Unknown"
            });

            _holidaysCache[year] = holidays;

            // Return a new copy so callers cannot mutate the cache entry directly
            return new List<Holiday>(holidays);
        }
        catch
        {
            // Fallback empty list if the external API is down
            return new List<Holiday>();
        }
    }

    public static async Task<bool> IsHolidayAsync(DateOnly date)
    {
        var holidays = await GetHolidaysAsync(date.Year);
        return holidays.Any(h => DateOnly.FromDateTime(h.Date) == date);
    }

    private class KhmerHolidayDto
    {
        public DateTime Date { get; set; }
        public string? Name_Kh { get; set; }
        public string? Name_En { get; set; }
    }
}