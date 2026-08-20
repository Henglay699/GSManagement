using GSManagement.Domain.DB;
using GSManagement.Domain.Entities;
using GSManagement.Domain.Entities.JointEntities;
using GSManagement.Domain.EntityConfig;
using Microsoft.EntityFrameworkCore;

namespace GSManagement.Domain.DB;

public class GSDbContext(DbContextOptions<GSDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<User> RefreshToken => Set<User>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Attendance> Attendances => Set<Attendance>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new UserConfig());
        modelBuilder.ApplyConfiguration(new RoleConfig());
        modelBuilder.ApplyConfiguration(new RefreshTokenConfig());
        modelBuilder.ApplyConfiguration(new PermissionConfig());
        modelBuilder.ApplyConfiguration(new AttendanceConfig());

        base.OnModelCreating(modelBuilder);
    }


}
