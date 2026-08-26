using GSManagement.Domain.Entities;
using GSManagement.Domain.Entities.Enums;
using Microsoft.AspNetCore.Authorization;

namespace GSManagement.Api.Middlewares.auth;

public class HasPermissionAttribute : AuthorizeAttribute
{
    public HasPermissionAttribute(AppPermission permission)
        : base(policy: permission.ToString())
    {
    }
}
