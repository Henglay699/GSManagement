using GSManagement.Domain.Entities.Enums;
using JwtTest.Middlewares.CheckPermission;
using GSManagement.Api.Features.UserFeature.DTOs;
using GSManagement.Api.Shared.Models;
using Microsoft.AspNetCore.Mvc;

namespace GSManagement.Api.Features.UserFeature;

[ApiController]
[Route("api/[controller]")]
public class UserController(IUserService userService) : ControllerBase
{
    [HttpGet]
    [HasPermission(AppPermission.ViewUser)]
    public async Task<ActionResult<PagedResult<UserResponse>>> GetAllUsersPagination(
        [FromQuery] int pageNumber,
        [FromQuery] int pageSize,
        [FromQuery] string? searchTerm,
        CancellationToken ct)
    {
        var results = await userService.GetUsersAsync(
            pageNumber, pageSize, searchTerm, ct);

        return Ok(results.Value);
    }

    [HttpGet("select-options")]
    public async Task<ActionResult<PagedResult<UserResponse>>> GetAllUsersData(
        CancellationToken ct)
    {
        var results = await userService.GetUsersDataAsync(ct);

        return Ok(results);
    }

    [HttpGet("{id}")]
    [HasPermission(AppPermission.ViewUser)]
    public async Task<ActionResult<UserResponse>> GetUserById(int id, CancellationToken cancellationToken)
    {
        var user = await userService.GetUserByIdAsync(id, cancellationToken);
        return user.IsSuccess ? Ok(user.Value) : NotFound(new { error = user.ErrorMessage });
    }

    [HttpPost]
    [HasPermission(AppPermission.CreateUser)]
    public async Task<ActionResult<UserResponse>> CreateUser(CreateUserRequest request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            return BadRequest(new { error = "Request body cannot be null." });
        }

        if (request.RoleIds?.Any() == true && !CanAssignRoles)
        {
            return MissingAssignRole();
        }

        var result = await userService.CreateUserAsync(request, cancellationToken);

        if (!result.IsSuccess)
        {
            return result.ErrorType switch
            {
                ErrorType.Conflict => Conflict(new { error = result.ErrorMessage }),
                _ => BadRequest(new { error = result.ErrorMessage }),
            };
        }

        return CreatedAtAction(nameof(GetUserById), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPut("{id:int}")]
    [HasPermission(AppPermission.UpdateUser)]
    public async Task<ActionResult<UserResponse>> UpdateUser(int id, UpdateUserRequest request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            return BadRequest(new { error = "Request body cannot be null." });
        }
        // Omitting RoleIds keeps the user's current roles; sending them needs AssignRole.
        if (request.RoleIds is not null && !CanAssignRoles)
        {
            return MissingAssignRole();
        }

        var result = await userService.UpdateUserAsync(request, id, cancellationToken);
        if (!result.IsSuccess)
        {
            return result.ErrorType switch
            {
                ErrorType.Conflict => Conflict(new { error = result.ErrorMessage }),
                ErrorType.NotFound => NotFound(new { error = result.ErrorMessage }),
                _ => BadRequest(new { error = result.ErrorMessage })
            };
        }

        return Ok(result.Value);
    }

    private bool CanAssignRoles =>
        User.HasClaim(UserAccessCache.PermissionClaimType, nameof(AppPermission.AssignRole));

    private ObjectResult MissingAssignRole() =>
        StatusCode(StatusCodes.Status403Forbidden,
            new { error = "You don't have permission to assign roles (AssignRole)." });

    [HttpDelete("{id}")]
    [HasPermission(AppPermission.DeleteUser)]
    public async Task<ActionResult> DeleteUser(int id, CancellationToken cancellationToken)
    {
        var result = await userService.DeleteUserAsync(id, cancellationToken);
        if (!result.IsSuccess)
        {
            return result.ErrorType switch
            {
                ErrorType.NotFound => NotFound(new { error = result.ErrorMessage }),
                _ => BadRequest(new { error = result.ErrorMessage })
            };
        }

        return NoContent();
    }

    // Upload a new photo or replace the existing one (multipart/form-data, field "file").
    [HttpPut("{id:int}/photo")]
    [RequestSizeLimit(UserService.MaxPhotoBytes + 64 * 1024)]
    [Consumes("multipart/form-data")]
    [HasPermission(AppPermission.UpdateUser)]
    public async Task<ActionResult<UserPhotoResponse>> UploadPhoto(int id, IFormFile file, CancellationToken cancellationToken)
    {
        var result = await userService.UploadPhotoAsync(id, file, cancellationToken);
        if (!result.IsSuccess)
        {
            return result.ErrorType switch
            {
                ErrorType.NotFound => NotFound(new { error = result.ErrorMessage }),
                _ => BadRequest(new { error = result.ErrorMessage })
            };
        }

        return Ok(result.Value);
    }

    [HttpDelete("{id:int}/photo")]
    [HasPermission(AppPermission.UpdateUser)]
    public async Task<ActionResult> RemovePhoto(int id, CancellationToken cancellationToken)
    {
        var result = await userService.RemovePhotoAsync(id, cancellationToken);
        if (!result.IsSuccess)
        {
            return result.ErrorType switch
            {
                ErrorType.NotFound => NotFound(new { error = result.ErrorMessage }),
                _ => BadRequest(new { error = result.ErrorMessage })
            };
        }

        return NoContent();
    }
}
