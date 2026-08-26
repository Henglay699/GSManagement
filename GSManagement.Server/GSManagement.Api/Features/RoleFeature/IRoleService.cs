using GSManagement.Api.Features.RoleFeature.DTOs;
using GSManagement.Api.Shared.Models;

namespace GSManagement.Api.Features.RoleFeature;

public interface IRoleService
{
    Task<Result<PagedResult<RoleResponse>>> GetAllRoleAsync(
        int pageNumber,
        int pageSize,
        string? searchTerm,
        CancellationToken cancellationToken);
    Task<Result<RoleResponse>> GetRoleByIdAsync(int Id, CancellationToken cancellationToken);
    Task<Result<RoleResponse>> CreateRoleAsync(CreateRoleRequest createRoleRequest, CancellationToken cancellationToken);
    Task<Result<RoleResponse>> UpdateRoleAsync(UpdateRoleRequest updateRoleRequest, int Id, CancellationToken cancellationToken);
    Task<Result<bool>> DeleteRoleAsync(int Id, CancellationToken cancellationToken);
}
