using GSManagement.Domain.DB;
using GSManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GSManagement.Api.Extentions;

public static class DatabaseSeeder
{
    public static async Task SeedData(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GSDbContext>();
        if (context.Database.GetPendingMigrations().Any())
        {
            await context.Database.MigrateAsync();
        }
        await context.Database.EnsureCreatedAsync();

        if (!context.Permissions.Any())
        {
            context.Permissions.AddRange(
                Enum.GetValues<AppPermission>()
                    .Select(permission => new Permission
                    {
                        PermissionName = permission
                    })
            );
            await context.SaveChangesAsync();
        }

        if (!context.Roles.Any())
        {
            var permissions = await context.Permissions.ToListAsync();

            var viewUserPermission = permissions.First(r => r.PermissionName == AppPermission.ViewUser);
            var createUserPermission = permissions.First(r => r.PermissionName == AppPermission.CreateUser);
            var updateUserPermission = permissions.First(r => r.PermissionName == AppPermission.UpdateUser);
            var deleteUserPermission = permissions.First(r => r.PermissionName == AppPermission.DeleteUser);

            var userModulePermissions = new List<Permission>
            {
                viewUserPermission,
                createUserPermission,
                updateUserPermission,
                deleteUserPermission
            };

            context.Roles.AddRange(
                new Role { RoleName = "Admin", Permissions = userModulePermissions },
                new Role { RoleName = "HR", Permissions = userModulePermissions },
                new Role { RoleName = "Operation" },
                new Role { RoleName = "Accountant" }
            );
            await context.SaveChangesAsync();
        }

        if (!context.Users.Any())
        {
            var adminRoles = context.Roles.First(r => r.RoleName == "Admin");
            var hrRoles = context.Roles.First(r => r.RoleName == "HR");
            var operationRoles = context.Roles.First(r => r.RoleName == "Operation");
            var accountantRoles = context.Roles.First(r => r.RoleName == "Accountant");

            context.Users.AddRange(
                new User
                {
                    UserName = "Ly Henglay",
                    Email = "henglay699@gmail.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Henglay699@"),
                    Roles = new List<Role> { adminRoles }
                },
                new User
                {
                    UserName = "Helen",
                    Email = "helen@gmail.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("helen@"),
                    Roles = new List<Role> { hrRoles }
                },
                new User
                {
                    UserName = "Sary Chhunleang",
                    Email = "chhunleang@gmail.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("chhunleang@"),
                    Roles = new List<Role> { operationRoles }
                },
                new User
                {
                    UserName = "Vichea Thnin",
                    Email = "vicheathnin@gmail.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("vicheathnin@"),
                    Roles = new List<Role> { operationRoles }
                },
                new User
                {
                    UserName = "Ly Cheng",
                    Email = "lycheng@gmail.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("lycheng@"),
                    Roles = new List<Role> { accountantRoles }
                }
            );
            await context.SaveChangesAsync();
        }
        if (!context.Attendances.Any())
        {
            var chhunleang = context.Users.First(u => u.Email == "chhunleang@gmail.com");
            context.Attendances.AddRange(
                new Attendance
                {
                    UserId = chhunleang.Id,
                    Date = DateOnly.FromDateTime(DateTime.Now),
                    CheckInTime = new TimeOnly(8, 0),
                    CheckOutTime = new TimeOnly(16, 0),
                    Status = AttendanceStatus.OnTime,
                    Remark = "Arrived On Time"
                }
            );
            await context.SaveChangesAsync();
        }
    }
}
