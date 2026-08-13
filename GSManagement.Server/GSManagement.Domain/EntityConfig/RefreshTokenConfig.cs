using GSManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GSManagement.Domain.EntityConfig;

internal class RefreshTokenConfig : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.Property(rt => rt.Id).ValueGeneratedOnAdd();
        builder.HasIndex(rt => rt.Token)
              .IsUnique();
    }
}
