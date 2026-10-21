namespace GSManagement.Api.Features.Auth.DTOs;

public record AuthResponeDto
(
    string AccesToken,
    string RefreshToken,
    int ExpiresInMinutes
);
