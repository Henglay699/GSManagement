using System.ComponentModel.DataAnnotations;

namespace GSManagement.Api.Features.Auth.DTOs;

public record ForgotPasswordRequest([Required][EmailAddress] string Email);

public record ResetPasswordRequest([Required] string Token, [Required] string NewPassword);
