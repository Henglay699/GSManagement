namespace GSManagement.Api.Features.Auth.DTOs;

public record CurrentUserDto
(
    int Id,
    string UserName,
    string Email,
    string? ImageUrl,
    IEnumerable<string> Roles,
    IEnumerable<string> Permissions
);
