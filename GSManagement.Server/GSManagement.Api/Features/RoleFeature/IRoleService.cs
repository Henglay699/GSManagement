using GSManagement.Api.Features.RoleFeature.DTOs;
using GSManagement.Api.Shared.Models;

namespace GSManagement.Api.Features.RoleFeature;

public interface IRoleService
{
    Task<Result<List<RoleResponse>>> GetAllRoleAsync(CancellationToken cancellationToken);
    Task<Result<RoleResponse>> GetRoleByIdAsync(int Id, CancellationToken cancellationToken);
    Task<Result<RoleResponse>> CreateRoleAsync(CreateRoleRequest createRoleRequest, CancellationToken cancellationToken);
    Task<Result<RoleResponse>> UpdateRoleAsync(UpdateRoleRequest updateRoleRequest, int Id, CancellationToken cancellationToken);
    Task<Result<bool>> DeleteRoleAsync(int Id, CancellationToken cancellationToken);
}
