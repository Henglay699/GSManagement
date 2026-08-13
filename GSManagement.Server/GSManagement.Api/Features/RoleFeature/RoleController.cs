using GSManagement.Api.Features.RoleFeature.DTOs;
using GSManagement.Api.Shared.Models;
using Microsoft.AspNetCore.Mvc;

namespace GSManagement.Api.Features.RoleFeature;

[ApiController]
[Route("api/[controller]")]
public class RoleController(IRoleService roleService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<RoleResponse>>> GetAlRoles(CancellationToken ct)
    {
        var results = await roleService.GetAllRoleAsync(ct);

        return results.IsSuccess ? Ok(results.Value) : Ok(new { error = results.ErrorMessage });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RoleResponse>> GetRoleById(int id, CancellationToken ct)
    {
        var result = await roleService.GetRoleByIdAsync(id, ct);

        return result.IsSuccess ? Ok(result.Value) : NotFound(new { error = result.ErrorMessage });
    }

    [HttpPost]
    public async Task<ActionResult<RoleResponse>> CreateRole([FromBody] CreateRoleRequest request, CancellationToken ct)
    {
        if (request is null)
        {
            return BadRequest(new { error = "Request body cannot be null." });
        }

        var result = await roleService.CreateRoleAsync(request, ct);
        if (!result.IsSuccess)
        {
            return result.ErrorType switch
            {
                ErrorType.Conflict => Conflict(new { error = result.ErrorMessage }),
                _ => BadRequest(new { error = result.ErrorMessage })
            };
        }
        return CreatedAtAction(nameof(GetRoleById), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<RoleResponse>> UpdateRole([FromBody] UpdateRoleRequest request, int id, CancellationToken ct)
    {
        if (request == null)
        {
            return BadRequest(new { error = "Request body cannot be null." });
        }
        var result = await roleService.UpdateRoleAsync(request, id, ct);

        if (!result.IsSuccess)
        {
            return result.ErrorType switch
            {
                ErrorType.Conflict => Conflict(new { error = result.ErrorMessage }),
                ErrorType.Validation => BadRequest(new { error = result.ErrorMessage }),
                _ => BadRequest(new { error = "id is not provided yet" })
            };
        }
        return Ok(result.Value);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<RoleResponse>> DeleteRole(int id, CancellationToken ct)
    {
        var result = await roleService.DeleteRoleAsync(id, ct);
        if (!result.IsSuccess)
        {
            return result.ErrorType switch
            {
                ErrorType.NotFound => NotFound(new { error = result.ErrorMessage }),
                _ => BadRequest(new { error = "id is not provided yet" })
            };
        }

        return NoContent();
    }
}
