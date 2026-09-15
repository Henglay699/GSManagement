namespace GSManagement.Api.Features.UserFeature.DTOs;

public record UsersSelectionRespone
(
    int Id,
    string UserName,
    string Email,
    string? ImageUrl,
    string? Roles
);
