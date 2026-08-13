using GSManagement.Domain.Entities;
using GSManagement.Domain.Entities.JointEntities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GSManagement.Domain.EntityConfig;

internal class UserConfig : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);
        builder.HasIndex(e => e.Email).IsUnique();

        builder.Property(e => e.Id).ValueGeneratedOnAdd();
        builder.Property(u => u.UserName)
               .IsRequired()
               .HasMaxLength(200);
        builder.Property(u => u.Email)
               .HasMaxLength(60);

        // user-role
        builder.HasMany(u => u.Roles).WithMany(r => r.Users)
               .UsingEntity<UserRole>(
                j => j
                .HasOne(ur => ur.Role)
                .WithMany().HasForeignKey(ur => ur.RoleId),

                j => j
                .HasOne(u => u.User)
                .WithMany().HasForeignKey(ur => ur.UserId),

                j =>
                {
                    j.ToTable("UserRoles");

                    j.HasKey(x => new { x.UserId, x.RoleId });
                });

        //user-refreshtoken
        builder.HasMany(u => u.RefreshTokens)
               .WithOne(rt => rt.User)
               .HasForeignKey(rt => rt.UserId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
