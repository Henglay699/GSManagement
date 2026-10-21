using System.ComponentModel.DataAnnotations;

namespace GSManagement.Api.Features.Auth.DTOs;

public record AuthRequestDto
(
    [Required(ErrorMessage = "Username is required.")]
    string Email,
    [Required(ErrorMessage = "Password is required.")]
    string Password,
    [Required(ErrorMessage = "DeviceId is required.")]
    string DeviceId
);
