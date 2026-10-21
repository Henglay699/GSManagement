using GSManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GSManagement.Domain.EntityConfig;

internal class OvertimeRecordConfig : IEntityTypeConfiguration<OvertimeRecord>
{
    public void Configure(EntityTypeBuilder<OvertimeRecord> builder)
    {
        builder.HasKey(o => o.Id);
        builder.Property(o => o.Id).ValueGeneratedOnAdd();

        builder.Property(o => o.Reason).HasMaxLength(500);

        builder.HasOne(o => o.Attendance)
            .WithOne(a => a.OvertimeRecord)
            .HasForeignKey<OvertimeRecord>(o => o.AttendanceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
