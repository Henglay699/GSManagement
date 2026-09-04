using GSManagement.Domain.Entities;
using GSManagement.Domain.Entities.JointEntities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GSManagement.Domain.EntityConfig;

internal class RoleConfig : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.HasKey(u => u.Id);
        builder.HasIndex(e => e.RoleName).IsUnique();

        builder.Property(e => e.Id).ValueGeneratedOnAdd();
        builder.Property(e => e.Description).HasMaxLength(120);
        builder.Property(u => u.RoleName)
               .IsRequired()
               .HasMaxLength(60);

        // RoleConfig.cs
        builder.HasMany(r => r.Permissions)
               .WithMany(p => p.Roles)
               .UsingEntity<RolePermission>(
                   j => j.ToTable("RolePermissions")
               );
    }
}