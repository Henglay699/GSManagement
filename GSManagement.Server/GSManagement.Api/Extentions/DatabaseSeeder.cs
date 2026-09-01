using GSManagement.Domain.DB;
using GSManagement.Domain.Entities;
using GSManagement.Domain.Entities.Enums;
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

        // 1. Seed Permissions with Modules
        if (!await context.Permissions.AnyAsync())
        {
            var permissionsToSeed = Enum.GetValues<AppPermission>()
                .Select(permission => new Permission
                {
                    PermissionName = permission,
                    Module = GetModuleFromPermission(permission),
                    Description = GetDescription(permission),
                    CreatedAt = DateTime.Now
                });

            await context.Permissions.AddRangeAsync(permissionsToSeed);
            await context.SaveChangesAsync();
        }

        // 2. Seed Roles
        if (!await context.Roles.AnyAsync())
        {
            var permissions = await context.Permissions.ToListAsync();

            // Fetch user module permissions dynamically
            var userModulePermissions = permissions
                .Where(p => p.Module == PermissionModule.User)
                .ToList();

            await context.Roles.AddRangeAsync(
                new Role { RoleName = "Admin", Permissions = permissions, CreatedAt = DateTime.Now }, // Admin gets all permissions
                new Role { RoleName = "HR", Permissions = userModulePermissions, CreatedAt = DateTime.Now },
                new Role { RoleName = "Operation", CreatedAt = DateTime.Now },
                new Role { RoleName = "Accountant", CreatedAt = DateTime.Now }
            );
            await context.SaveChangesAsync();
        }

        // 3. Seed Users
        if (!await context.Users.AnyAsync())
        {
            var adminRole = await context.Roles.FirstAsync(r => r.RoleName == "Admin");
            var hrRole = await context.Roles.FirstAsync(r => r.RoleName == "HR");
            var operationRole = await context.Roles.FirstAsync(r => r.RoleName == "Operation");
            var accountantRole = await context.Roles.FirstAsync(r => r.RoleName == "Accountant");

            await context.Users.AddRangeAsync(
                new User
                {
                    UserName = "Ly Henglay",
                    Email = "henglay699@gmail.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Henglay699@"),
                    Roles = new List<Role> { adminRole }
                },
                new User
                {
                    UserName = "Helen",
                    Email = "helen@gmail.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("helen@"),
                    Roles = new List<Role> { hrRole }
                },
                new User
                {
                    UserName = "Sary Chhunleang",
                    Email = "chhunleang@gmail.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("chhunleang@"),
                    Roles = new List<Role> { operationRole }
                },
                new User
                {
                    UserName = "Vichea Thnin",
                    Email = "vicheathnin@gmail.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("vicheathnin@"),
                    Roles = new List<Role> { operationRole }
                },
                new User
                {
                    UserName = "Ly Cheng",
                    Email = "lycheng@gmail.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("lycheng@"),
                    Roles = new List<Role> { accountantRole }
                }
            );
            await context.SaveChangesAsync();
        }

        // 4. Seed Attendance
        if (!await context.Attendances.AnyAsync())
        {
            var chhunleang = await context.Users.FirstAsync(u => u.Email == "chhunleang@gmail.com");
            var henglay = await context.Users.FirstAsync(u => u.Email == "henglay699@gmail.com");
            var thnin = await context.Users.FirstAsync(u => u.Email == "vicheathnin@gmail.com");
            var lycheng = await context.Users.FirstAsync(u => u.Email == "lycheng@gmail.com");
            var helen = await context.Users.FirstAsync(u => u.Email == "helen@gmail.com");

            await context.Attendances.AddRangeAsync(
                new Attendance
                {
                    UserId = chhunleang.Id,
                    Date = DateOnly.FromDateTime(DateTime.Now),
                    CheckInTime = new TimeOnly(8, 0),
                    Status = AttendanceStatus.OnTime,
                    Remark = "Late"
                },
                new Attendance
                {
                    UserId = henglay.Id,
                    Date = DateOnly.FromDateTime(DateTime.Now),
                    CheckInTime = new TimeOnly(8, 0),
                    CheckOutTime = new TimeOnly(16, 0),
                    Status = AttendanceStatus.OnTime,
                    Remark = "Arrived On Time"
                },
                new Attendance
                {
                    UserId = thnin.Id,
                    Date = DateOnly.FromDateTime(DateTime.Now),
                    Status = AttendanceStatus.Leave,
                    Remark = "On Leave"
                },
                new Attendance
                {
                    UserId = lycheng.Id,
                    Date = DateOnly.FromDateTime(DateTime.Now),
                    Status = AttendanceStatus.Absent,
                    Remark = "Absent Not Inform"
                },
                new Attendance
                {
                    UserId = helen.Id,
                    Date = DateOnly.FromDateTime(DateTime.Now),
                    CheckInTime = new TimeOnly(8, 26),
                    CheckOutTime = new TimeOnly(16, 0),
                    Status = AttendanceStatus.Late,
                    Remark = "Late"
                }
            );
            await context.SaveChangesAsync();
        }
    }

    private static PermissionModule GetModuleFromPermission(AppPermission permission)
    {
        return permission switch
        {
            AppPermission.ViewUser or AppPermission.CreateUser or AppPermission.UpdateUser or AppPermission.DeleteUser
                => PermissionModule.User,

            AppPermission.ViewRole or AppPermission.CreateRole or AppPermission.UpdateRole or AppPermission.DeleteRole
                => PermissionModule.Role,

            AppPermission.ViewPermission or AppPermission.CreatePermission or AppPermission.UpdatePermssion or AppPermission.DeletePermssion
                => PermissionModule.Permission,

            AppPermission.ViewAttendance or AppPermission.CreateAttendance or AppPermission.UpdateAttendance or AppPermission.DeleteAttendance
                => PermissionModule.Attendance,

            AppPermission.ViewClient or AppPermission.CreateClient or AppPermission.UpdateClient or AppPermission.DeleteClient
                => PermissionModule.Client,

            _ => throw new ArgumentOutOfRangeException(nameof(permission), permission, "Unhandled permission enum value")
        };
    }
    private static string GetDescription(AppPermission permission) => permission switch
    {
        AppPermission.ViewUser
            => "Can " + nameof(AppPermission.ViewUser),
        AppPermission.CreateUser
            => "Can " + nameof(AppPermission.CreateUser),
        AppPermission.UpdateUser
            => "Can " + nameof(AppPermission.UpdateUser),
        AppPermission.DeleteUser
            => "Can " + nameof(AppPermission.DeleteUser),

        AppPermission.ViewRole
            => "Can " + nameof(AppPermission.ViewRole),
        AppPermission.CreateRole
            => "Can " + nameof(AppPermission.CreateRole),
        AppPermission.UpdateRole
            => "Can " + nameof(AppPermission.UpdateRole),
        AppPermission.DeleteRole
            => "Can " + nameof(AppPermission.DeleteRole),

        AppPermission.ViewPermission
            => "Can " + nameof(AppPermission.ViewPermission),
        AppPermission.CreatePermission
            => "Can " + nameof(AppPermission.CreatePermission),
        AppPermission.UpdatePermssion
            => "Can " + nameof(AppPermission.UpdatePermssion),
        AppPermission.DeletePermssion
            => "Can " + nameof(AppPermission.DeletePermssion),

        AppPermission.ViewAttendance
            => "Can " + nameof(AppPermission.ViewAttendance),
        AppPermission.CreateAttendance
            => "Can " + nameof(AppPermission.CreateAttendance),
        AppPermission.UpdateAttendance
            => "Can " + nameof(AppPermission.UpdateAttendance),
        AppPermission.DeleteAttendance
            => "Can " + nameof(AppPermission.DeleteAttendance),

        AppPermission.ViewClient
            => "Can " + nameof(AppPermission.ViewClient),
        AppPermission.CreateClient
            => "Can " + nameof(AppPermission.CreateClient),
        AppPermission.UpdateClient
            => "Can " + nameof(AppPermission.UpdateClient),
        AppPermission.DeleteClient
            => "Can " + nameof(AppPermission.DeleteClient),

        _ => throw new ArgumentOutOfRangeException(nameof(permission), permission, "Unhandled permission enum value")
    };
}