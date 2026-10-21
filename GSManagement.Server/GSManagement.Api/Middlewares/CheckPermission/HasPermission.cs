using GSManagement.Domain.Entities.Enums;
using Microsoft.AspNetCore.Mvc;

namespace JwtTest.Middlewares.CheckPermission;

public sealed class HasPermission : TypeFilterAttribute
{
    public HasPermission(AppPermission permission) : base(typeof(PermissionAuthorizationFilter))
    {
        Arguments = [permission];
    }
}
