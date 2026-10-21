using System.Security.Claims;
using GSManagement.Api.Features.UserFeature;
using GSManagement.Api.Features.UserFeature.DTOs;
using GSManagement.Api.Shared.Models;
using Microsoft.AspNetCore.Mvc;

namespace GSManagement.Api.Features.Profile;

// "My Profile": every logged-in user can manage their own account here,
// whatever their permissions. The target is always the caller (from the JWT),
// never an id from the request, so nobody can edit someone else this way.
[ApiController]
[Route("api/profile")]
public class ProfileController(IUserService userService, EmailChangeService emailChange) : ControllerBase
{
    // The global fallback policy guarantees an authenticated user here, and
    // OnTokenValidated rejects tokens without a numeric NameIdentifier claim.
    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPut]
    public async Task<ActionResult> UpdateProfile(UpdateProfileRequest request, CancellationToken ct)
    {
        var result = await userService.UpdateOwnNameAsync(CurrentUserId, request.UserName, ct);
        return result.IsSuccess ? NoContent() : ToError(result);
    }

    [HttpPut("password")]
    public async Task<ActionResult> ChangePassword(ChangePasswordRequest request, CancellationToken ct)
    {
        var result = await userService.ChangeOwnPasswordAsync(CurrentUserId, request.CurrentPassword, request.NewPassword, ct);
        return result.IsSuccess ? NoContent() : ToError(result);
    }

    // Step 1: check the password and email a 6-digit code to the new address.
    [HttpPost("email/request")]
    public async Task<ActionResult> RequestEmailChange(RequestEmailChangeRequest request, CancellationToken ct)
    {
        var result = await emailChange.RequestAsync(CurrentUserId, request.NewEmail, request.CurrentPassword, ct);
        return result.IsSuccess ? NoContent() : ToError(result);
    }

    // Step 2: the code proves they own the new address; the email changes now.
    [HttpPost("email/confirm")]
    public async Task<ActionResult> ConfirmEmailChange(ConfirmEmailChangeRequest request, CancellationToken ct)
    {
        var result = await emailChange.ConfirmAsync(CurrentUserId, request.Code, ct);
        return result.IsSuccess ? Ok(new { email = result.Value }) : ToError(result);
    }

    [HttpPut("photo")]
    [RequestSizeLimit(UserService.MaxPhotoBytes + 64 * 1024)]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<UserPhotoResponse>> UploadPhoto(IFormFile file, CancellationToken ct)
    {
        var result = await userService.UploadPhotoAsync(CurrentUserId, file, ct);
        return result.IsSuccess ? Ok(result.Value) : ToError(result);
    }

    [HttpDelete("photo")]
    public async Task<ActionResult> RemovePhoto(CancellationToken ct)
    {
        var result = await userService.RemovePhotoAsync(CurrentUserId, ct);
        return result.IsSuccess ? NoContent() : ToError(result);
    }

    private ActionResult ToError<T>(Result<T> result) => result.ErrorType switch
    {
        ErrorType.NotFound => NotFound(new { error = result.ErrorMessage }),
        ErrorType.Conflict => Conflict(new { error = result.ErrorMessage }),
        _ => BadRequest(new { error = result.ErrorMessage })
    };
}
