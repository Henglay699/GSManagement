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

        // Relationship 1: LeaveRequest -> Employee (User)
        builder.HasOne(l => l.User)
            .WithMany() // Or a collection property if you add LeaveRequests to User.cs
            .HasForeignKey(l => l.UserId)
            .OnDelete(DeleteBehavior.Restrict); // Prevents cascading delete loops

        // Relationship 2: LeaveRequest -> Admin/HR (Approver)
        builder.HasOne(l => l.Approver)
            .WithMany()
            .HasForeignKey(l => l.ApproverId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}