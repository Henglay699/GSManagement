using GSManagement.Api.Features.UserFeature.DTOs;
using GSManagement.Api.Shared.Models;
using Microsoft.AspNetCore.Mvc;

namespace GSManagement.Api.Features.UserFeature;

[ApiController]
[Route("api/[controller]")]
public class UserController(IUserService userService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<UserResponse>>> GetAllUsers()
    {
        var users = await userService.GetUsersAsync(CancellationToken.None);
        return users.IsSuccess ? Ok(users.Value) : Ok(users.ErrorMessage);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserResponse>> GetUserById(int id, CancellationToken cancellationToken)
    {
        var user = await userService.GetUserByIdAsync(id, cancellationToken);
        return user.IsSuccess ? Ok(user.Value) : NotFound(new { error = user.ErrorMessage });
    }

    [HttpPost]
    public async Task<ActionResult<UserResponse>> CreateUser(CreateUserRequest request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            return BadRequest(new { error = "Request body cannot be null." });
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
    public async Task<ActionResult<UserResponse>> UpdateUser(int id, UpdateUserRequest request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            return BadRequest(new { error = "Request body cannot be null." });
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

    [HttpDelete("{id}")]
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
}
