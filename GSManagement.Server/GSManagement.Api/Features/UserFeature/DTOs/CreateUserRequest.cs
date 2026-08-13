using System.ComponentModel.DataAnnotations;
namespace GSManagement.Api.Features.UserFeature.DTOs;
public record CreateUserRequest(
    [Required] string UserName,
    [Required] string Password,
    [Required][EmailAddress] string Email,
    string? ImageUrl,
    IEnumerable<int> RoleIds);
