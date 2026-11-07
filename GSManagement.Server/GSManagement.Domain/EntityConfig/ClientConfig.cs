using GSManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GSManagement.Domain.EntityConfig;

internal class ClientConfig : IEntityTypeConfiguration<Client>
{
    public void Configure(EntityTypeBuilder<Client> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).ValueGeneratedOnAdd();

        builder.Property(c => c.CompanyName)
               .IsRequired()
               .HasMaxLength(200);
        builder.Property(c => c.CompanyNameKm).HasMaxLength(200);
        builder.Property(c => c.Code).HasMaxLength(20);
        builder.Property(c => c.Email).HasMaxLength(120);
        builder.Property(c => c.Vat).HasMaxLength(40);
        builder.Property(c => c.BusinessType).HasMaxLength(100);
        builder.Property(c => c.Address).HasMaxLength(400);
        builder.Property(c => c.ContactName).HasMaxLength(120);
        builder.Property(c => c.Phone).HasMaxLength(40);
        builder.Property(c => c.CdcNo).HasMaxLength(60);
        builder.Property(c => c.Notes).HasMaxLength(1000);
        builder.Property(c => c.IsActive).HasDefaultValue(true);

        // Codes are unique when given (JR, JYX…); several clients may have none yet.
        builder.HasIndex(c => c.Code)
               .IsUnique()
               .HasFilter("\"Code\" IS NOT NULL");
        builder.HasIndex(c => c.CompanyName);
    }
}

internal class ClientOperatorConfig : IEntityTypeConfiguration<ClientOperator>
{
    public void Configure(EntityTypeBuilder<ClientOperator> builder)
    {
        builder.ToTable("ClientOperators");
        builder.HasKey(co => new { co.ClientId, co.UserId });

        builder.HasOne(co => co.Client)
               .WithMany(c => c.Operators)
               .HasForeignKey(co => co.ClientId)
               .OnDelete(DeleteBehavior.Cascade);

        // Removing a user removes their assignments; the client stays.
        builder.HasOne(co => co.User)
               .WithMany()
               .HasForeignKey(co => co.UserId)
               .OnDelete(DeleteBehavior.Cascade);

        // "My clients" lookups go by user.
        builder.HasIndex(co => co.UserId);

        // At most one primary operator per client.
        builder.HasIndex(co => co.ClientId)
               .IsUnique()
               .HasFilter("\"IsPrimary\" = true")
               .HasDatabaseName("IX_ClientOperators_SinglePrimary");
    }
}
