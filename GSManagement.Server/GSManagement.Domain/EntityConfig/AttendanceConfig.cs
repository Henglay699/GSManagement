using GSManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GSManagement.Domain.EntityConfig;

internal class AttendanceConfig : IEntityTypeConfiguration<Attendance>
{
    public void Configure(EntityTypeBuilder<Attendance> builder)
    {
        builder.Property(u => u.Id).ValueGeneratedOnAdd();
        builder.Property(u => u.Status)
            .HasConversion<string>()
            .HasMaxLength(60);

        builder.Property(a => a.HalfDayPeriod)
            .HasConversion<string>()
            .HasMaxLength(20);

        // Shift FK (nullable — null means the default shift was in effect)
        builder.HasOne(a => a.Shift)
            .WithMany()
            .HasForeignKey(a => a.ShiftId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Property(a => a.IsHalfDay)
            .HasDefaultValue(false);
    }
}
