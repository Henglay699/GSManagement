using GSManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GSManagement.Domain.EntityConfig;

public class LeaveRequestConfig : IEntityTypeConfiguration<LeaveRequest>
{
    public void Configure(EntityTypeBuilder<LeaveRequest> builder)
    {
        builder.Property(u => u.Id).ValueGeneratedOnAdd();
        builder.Property(u => u.Status)
        .HasConversion<string>()
        .HasMaxLength(60);
        builder.Property(u => u.LeaveType)
        .HasConversion<string>()
        .HasMaxLength(60);

        builder.Property(u => u.Remark).HasMaxLength(120);
    }

}
