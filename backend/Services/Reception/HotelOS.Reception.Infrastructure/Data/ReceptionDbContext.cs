using HotelOS.Reception.Core.Entities;
using HotelOS.Reception.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace HotelOS.Reception.Infrastructure.Data;

public class ReceptionDbContext : DbContext
{
    public ReceptionDbContext(DbContextOptions<ReceptionDbContext> options)
        : base(options) { }

    public DbSet<Room>            Rooms    => Set<Room>();
    public DbSet<Booking>         Bookings => Set<Booking>();
    public DbSet<RoomKey>         RoomKeys => Set<RoomKey>();
    public DbSet<RoomBufferConfig> BufferConfigs => Set<RoomBufferConfig>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Room ──────────────────────────────────────────────
        modelBuilder.Entity<Room>(entity =>
        {
            entity.ToTable("rooms");
            entity.HasKey(r => r.Id);

            entity.Property(r => r.Id)
                  .HasColumnName("id");
            entity.Property(r => r.RoomNumber)
                  .HasColumnName("room_number")
                  .HasMaxLength(16)
                  .IsRequired();
            entity.Property(r => r.Floor)
                  .HasColumnName("floor");
            entity.Property(r => r.Style)
                  .HasColumnName("style")
                  .HasConversion<string>()
                  .HasMaxLength(32);
            entity.Property(r => r.Status)
                  .HasColumnName("status")
                  .HasConversion<string>()
                  .HasMaxLength(32);
            entity.Property(r => r.PricePerNight)
                  .HasColumnName("price_per_night");
            entity.Property(r => r.Capacity)
                  .HasColumnName("capacity");
            entity.Property(r => r.IsSmokingAllowed)
                  .HasColumnName("is_smoking_allowed")
                  .HasDefaultValue(false);
            entity.Property(r => r.Description)
                  .HasColumnName("description")
                  .HasMaxLength(1000);

            entity.HasIndex(r => r.RoomNumber).IsUnique();

            // Room → Bookings (one-to-many)
            entity.HasMany(r => r.Bookings)
                  .WithOne(b => b.Room)
                  .HasForeignKey(b => b.RoomId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Room → RoomKeys (one-to-many)
            entity.HasMany(r => r.Keys)
                  .WithOne()
                  .HasForeignKey(k => k.RoomId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Room → RoomBufferConfig (one-to-one)
            entity.HasOne(r => r.BufferConfig)
                  .WithOne()
                  .HasForeignKey<RoomBufferConfig>(c => c.RoomId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── RoomBufferConfig ───────────────────────────────────
        modelBuilder.Entity<RoomBufferConfig>(entity =>
        {
            entity.ToTable("room_buffer_configs");
            entity.HasKey(c => c.Id);

            entity.Property(c => c.Id)
                  .HasColumnName("id");
            entity.Property(c => c.RoomId)
                  .HasColumnName("room_id");
            entity.Property(c => c.CleaningBufferMins)
                  .HasColumnName("cleaning_buffer_mins")
                  .HasDefaultValue(120);
            entity.Property(c => c.MaintenanceBufferMins)
                  .HasColumnName("maintenance_buffer_mins")
                  .HasDefaultValue(240);
            entity.Property(c => c.BufferType)
                  .HasColumnName("buffer_type")
                  .HasConversion<string>()
                  .HasMaxLength(32);
            entity.Property(c => c.UpdatedAt)
                  .HasColumnName("updated_at");
            entity.Property(c => c.UpdatedBy)
                  .HasColumnName("updated_by")
                  .HasMaxLength(64);
        });

        // ── Booking ────────────────────────────────────────────
        modelBuilder.Entity<Booking>(entity =>
        {
            entity.ToTable("bookings");
            entity.HasKey(b => b.Id);

            entity.Property(b => b.Id)
                  .HasColumnName("id");
            entity.Property(b => b.GuestId)
                  .HasColumnName("guest_id")
                  .IsRequired();
            entity.Property(b => b.RoomId)
                  .HasColumnName("room_id")
                  .IsRequired();
            entity.Property(b => b.CheckIn)
                  .HasColumnName("check_in");
            entity.Property(b => b.CheckOut)
                  .HasColumnName("check_out");
            entity.Property(b => b.EffectiveCheckout)
                  .HasColumnName("effective_checkout");
            entity.Property(b => b.Status)
                  .HasColumnName("status")
                  .HasConversion<string>()
                  .HasMaxLength(32);
            entity.Property(b => b.TotalPrice)
                  .HasColumnName("total_price");
            entity.Property(b => b.PenaltyType)
                  .HasColumnName("penalty_type")
                  .HasConversion<string>()
                  .HasMaxLength(32);
            entity.Property(b => b.CreatedAt)
                  .HasColumnName("created_at");
            entity.Property(b => b.ExpiresAt)
                  .HasColumnName("expires_at");

            // index for fast expiry queries
            entity.HasIndex(b => new { b.Status, b.ExpiresAt });
            // index for guest bookings
            entity.HasIndex(b => b.GuestId);
        });

        // ── RoomKey ────────────────────────────────────────────
        modelBuilder.Entity<RoomKey>(entity =>
        {
            entity.ToTable("room_keys");
            entity.HasKey(k => k.Id);

            entity.Property(k => k.Id)
                  .HasColumnName("id");
            entity.Property(k => k.RoomId)
                  .HasColumnName("room_id");
            entity.Property(k => k.Barcode)
                  .HasColumnName("barcode")
                  .HasMaxLength(128);
            entity.Property(k => k.IssuedAt)
                  .HasColumnName("issued_at");
            entity.Property(k => k.Active)
                  .HasColumnName("active")
                  .HasDefaultValue(false);
            entity.Property(k => k.IsMaster)
                  .HasColumnName("is_master")
                  .HasDefaultValue(false);
        });
    }
}