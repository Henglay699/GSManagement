using Microsoft.AspNetCore.Authorization;

namespace GSManagement.Api.Middlewares.auth;

public class PermissionRequirement : IAuthorizationRequirement
{
    public string Permission {get;}

    public PermissionRequirement(string permission)
    {
        Permission = permission;
    }

}
