using GSManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GSManagement.Domain.EntityConfig;

internal class PermissionConfig : IEntityTypeConfiguration<Permission>
{
    public void Configure(EntityTypeBuilder<Permission> builder)
    {
        builder.HasKey(p => p.Id);
        builder.HasIndex(p => p.PermissionName).IsUnique();
        builder.Property(p => p.Id).ValueGeneratedOnAdd();
        builder.Property(p => p.Description).HasMaxLength(120);
        builder.Property(p => p.PermissionName).IsRequired()
               .HasMaxLength(30);
        builder.Property(p => p.PermissionName)
               .HasConversion<string>();
        builder.Property(p => p.Module)
               .HasConversion<string>();
    }
}
