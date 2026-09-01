namespace GSManagement.Api.Shared.Models;

public class Holiday
{
    public DateTime Date { get; set; }
    public required string KhmerName { get; set; }
    public required string EnglishName { get; set; }
}
