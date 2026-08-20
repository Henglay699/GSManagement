using GSManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GSManagement.Domain.EntityConfig;

internal class ClientConfig : IEntityTypeConfiguration<Client>
{
    public void Configure(EntityTypeBuilder<Client> builder)
    {
        builder.HasKey(u => u.Id);
        builder.HasIndex(e => e.Email).IsUnique();
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.Property(u => u.CompanyName)
               .IsRequired()
               .HasMaxLength(200);
        builder.Property(u => u.Email)
               .HasMaxLength(60);
    }

}
