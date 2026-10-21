using System.ComponentModel.DataAnnotations;

namespace GSManagement.Api.Features.Profile;

public record UpdateProfileRequest([Required] string UserName);

public record RequestEmailChangeRequest(
    [Required][EmailAddress] string NewEmail,
    [Required] string CurrentPassword);

public record ConfirmEmailChangeRequest([Required] string Code);

public record ChangePasswordRequest(
    [Required] string CurrentPassword,
    [Required] string NewPassword);
