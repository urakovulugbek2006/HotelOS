using HotelOS.Housekeeping.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace HotelOS.Housekeeping.Infrastructure.Data;

public class HousekeepingDbContext : DbContext
{
    public HousekeepingDbContext(DbContextOptions<HousekeepingDbContext> options)
        : base(options) { }

    public DbSet<CleanlinessLog> CleanlinessLogs => Set<CleanlinessLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<CleanlinessLog>(entity =>
        {
            entity.ToTable("cleanliness_logs");
            entity.HasKey(l => l.Id);

            entity.Property(l => l.Id).HasColumnName("id");
            entity.Property(l => l.RoomId)
                  .HasColumnName("room_id").IsRequired();
            entity.Property(l => l.StaffId)
                  .HasColumnName("staff_id").IsRequired();
            entity.Property(l => l.Status)
                  .HasColumnName("status")
                  .HasConversion<string>().HasMaxLength(32);
            entity.Property(l => l.StartedAt)
                  .HasColumnName("started_at");
            entity.Property(l => l.CompletedAt)
                  .HasColumnName("completed_at");
            entity.Property(l => l.DurationMins)
                  .HasColumnName("duration_mins");
            entity.Property(l => l.Notes)
                  .HasColumnName("notes").HasMaxLength(1000);

            entity.HasIndex(l => l.RoomId);
            entity.HasIndex(l => l.StaffId);
            entity.HasIndex(l => l.Status);
        });
    }
}