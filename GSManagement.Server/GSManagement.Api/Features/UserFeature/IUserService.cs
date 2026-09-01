using GSManagement.Api.Features.UserFeature.DTOs;
using GSManagement.Api.Shared.Models;

namespace GSManagement.Api.Features.UserFeature;

public interface IUserService
{
    Task<Result<PagedResult<UserResponse>>> GetUsersAsync(
            int pageNumber, int pageSize, string? searchTerm, CancellationToken ct);
    Task<Result<UserResponse?>> GetUserByIdAsync(int Id, CancellationToken cancellationToken);
    Task<Result<UserResponse>> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken);
    Task<Result<UserResponse>> UpdateUserAsync(UpdateUserRequest request, int Id, CancellationToken cancellationToken);
    Task<Result<bool>> DeleteUserAsync(int? Id, CancellationToken cancellationToken);

    Task<List<UsersSelectionRespone>> GetUsersDataAsync(CancellationToken ct);
}