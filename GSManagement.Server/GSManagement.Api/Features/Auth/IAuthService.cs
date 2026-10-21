using GSManagement.Api.Features.Auth.DTOs;
using GSManagement.Api.Shared.Models;

namespace GSManagement.Api.Features.Auth;

public interface IAuthService
{   
    Task<AuthResponeDto> LoginAsync(AuthRequestDto login);
    Task<AuthResponeDto?> RefreshTokenAsync(string refreshToken, string deviceId);
    Task RevokeRefreshTokenAsync(string refreshToken, string deviceId);
    Task<CurrentUserDto?> GetCurrentUserAsync(int userId, CancellationToken ct);
    Task<int> RequestPasswordResetAsync(string email);
    Task<Result<bool>> ResetPasswordAsync(string token, string newPassword);
}

