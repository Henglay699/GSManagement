using System.Net.Http.Json;
using GSManagement.Api.Shared.Models;

namespace GSManagement.Api.Shared.Utils;

public static class PublicHolidaysHelper
{
    private static readonly HttpClient _httpClient = new();

    // Cache to store holidays by year so we only hit the external API once per year
    private static readonly Dictionary<int, List<Holiday>> _holidaysCache = [];

    public static async Task<List<Holiday>> GetHolidaysAsync(int year)
    {
        // Return from cache if we already fetched this year
        if (_holidaysCache.TryGetValue(year, out var cachedHolidays))
        {
            return cachedHolidays;
        }

        var url = $"https://khmer-public-holidays-api.vercel.app/holidays?year={year}";

        try
        {
            var nagerHolidays = await _httpClient.GetFromJsonAsync<List<KhmerHolidayDto>>(url);

            if (nagerHolidays == null) return new List<Holiday>();

            // Map the Nager response to your custom Holiday model
            var holidays = nagerHolidays.ConvertAll(h => new Holiday
            {
                Date = h.Date,
                KhmerName = h.Name_Kh ?? "Unknown",
                EnglishName = h.Name_En ?? "Unknown"
            });

            _holidaysCache[year] = holidays;
            return holidays;
        }
        catch
        {
            // Fallback empty list if the external API is down
            return [];
        }
    }


    // Private DTO to map the incoming JSON from Nager.Date
    private class KhmerHolidayDto
    {
        public DateTime Date { get; set; }
        public string? Name_Kh { get; set; }
        public string? Name_En { get; set; }
    }
}