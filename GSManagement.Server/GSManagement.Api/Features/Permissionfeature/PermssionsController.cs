using GSManagement.Api.Shared.Models;
using GSManagement.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace GSManagement.Api.Features.Permissionfeature;

[ApiController]
[Route("api")]
public class PermissionsController(PermissionService permissionService) : ControllerBase
{
    [HttpGet("permissions")]
    public async Task<ActionResult<List<PermissionResponse>>> Get(CancellationToken ct)
    {
        var results = await permissionService.GetPermissions(ct);
        return Ok(results.Value);
    }

    [HttpGet("permission/{Id}")]
    public async Task<ActionResult<PermissionResponse>> GetById(int Id, CancellationToken ct)
    {
        var results = await permissionService.GetPermissionsById(Id, ct);
        if (!results.IsSuccess)
        {
            return results.ErrorType switch
            {
                ErrorType.NotFound => NotFound(results.ErrorMessage),
                _ => BadRequest("Provide Id is required")
            };
        }
        return Ok(results.Value);
    }
    [HttpGet("attendances")]
    public async Task<ActionResult<Attendance>> GetAttendance(CancellationToken ct)
    {
        var results = await permissionService.GetAttendanceAsync(ct);
        return Ok(results);
    }
}
