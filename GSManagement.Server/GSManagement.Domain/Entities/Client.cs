namespace GSManagement.Domain.Entities;

public class Client
{
    public int Id { get; set; }
    public required string CompanyName { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public required string Vat { get; set; }
    public string? BusinessType { get; set; }
}
