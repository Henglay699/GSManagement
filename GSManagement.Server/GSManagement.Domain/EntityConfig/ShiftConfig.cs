using GSManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GSManagement.Domain.EntityConfig;

internal class ShiftConfig : IEntityTypeConfiguration<Shift>
{
    public void Configure(EntityTypeBuilder<Shift> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).ValueGeneratedOnAdd();

        builder.Property(s => s.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.StartTime).IsRequired();
        builder.Property(s => s.EndTime).IsRequired();

        builder.Property(s => s.GraceMinutes)
            .HasDefaultValue(15);

        builder.Property(s => s.IsDefault)
            .HasDefaultValue(false);

        builder.HasIndex(s => s.IsDefault)
            .HasFilter("[IsDefault] = 1")
            .IsUnique()
            .HasDatabaseName("IX_Shifts_SingleDefault");
    }
}
