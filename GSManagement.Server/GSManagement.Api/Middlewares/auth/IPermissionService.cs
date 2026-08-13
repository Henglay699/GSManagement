namespace GSManagement.Api.Middlewares.auth;

public interface IPermissionService
{
    Task<bool> HasPermission(int userId, string permission);
}
