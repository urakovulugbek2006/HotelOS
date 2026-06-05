using HotelOS.Maintenance.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace HotelOS.Maintenance.Infrastructure.Data;

public class MaintenanceDbContext : DbContext
{
    public MaintenanceDbContext(DbContextOptions<MaintenanceDbContext> options)
        : base(options) { }

    public DbSet<MaintenanceTicket> Tickets => Set<MaintenanceTicket>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<MaintenanceTicket>(entity =>
        {
            entity.ToTable("maintenance_tickets");
            entity.HasKey(t => t.Id);

            entity.Property(t => t.Id).HasColumnName("id");
            entity.Property(t => t.RoomId)
                .HasColumnName("room_id").IsRequired();
            entity.Property(t => t.ReportedBy)
                .HasColumnName("reported_by").IsRequired();
            entity.Property(t => t.Description)
                .HasColumnName("description").HasMaxLength(1000);
            entity.Property(t => t.Priority)
                .HasColumnName("priority").HasMaxLength(32);
            entity.Property(t => t.Status)
                .HasColumnName("status").HasMaxLength(32);
            entity.Property(t => t.EstimatedMins)
                .HasColumnName("estimated_mins");
            entity.Property(t => t.AssignedStaffId)
                .HasColumnName("assigned_staff_id");
            entity.Property(t => t.CreatedAt)
                .HasColumnName("created_at");
            entity.Property(t => t.ResolvedAt)
                .HasColumnName("resolved_at");

            entity.HasIndex(t => t.RoomId);
            entity.HasIndex(t => t.Status);
        });
    }
}