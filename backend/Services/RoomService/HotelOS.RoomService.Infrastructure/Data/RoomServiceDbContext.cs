using HotelOS.RoomService.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace HotelOS.RoomService.Infrastructure.Data;

public class RoomServiceDbContext : DbContext
{
    public RoomServiceDbContext(DbContextOptions<RoomServiceDbContext> options)
        : base(options) { }

    public DbSet<MenuItem>  MenuItems  => Set<MenuItem>();
    public DbSet<Order>     Orders     => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<MenuItem>(entity =>
        {
            entity.ToTable("menu_items");
            entity.HasKey(m => m.Id);
            entity.Property(m => m.Id).HasColumnName("id");
            entity.Property(m => m.Name)
                  .HasColumnName("name").HasMaxLength(128).IsRequired();
            entity.Property(m => m.Description)
                  .HasColumnName("description").HasMaxLength(512);
            entity.Property(m => m.Price).HasColumnName("price");
            entity.Property(m => m.Category)
                  .HasColumnName("category").HasMaxLength(64);
            entity.Property(m => m.IsAvailable)
                  .HasColumnName("is_available").HasDefaultValue(true);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("orders");
            entity.HasKey(o => o.Id);
            entity.Property(o => o.Id).HasColumnName("id");
            entity.Property(o => o.BookingId)
                  .HasColumnName("booking_id").IsRequired();
            entity.Property(o => o.RoomId)
                  .HasColumnName("room_id").IsRequired();
            entity.Property(o => o.GuestId)
                  .HasColumnName("guest_id").IsRequired();
            entity.Property(o => o.Status)
                  .HasColumnName("status")
                  .HasConversion<string>().HasMaxLength(32);
            entity.Property(o => o.TotalPrice).HasColumnName("total_price");
            entity.Property(o => o.CreatedAt).HasColumnName("created_at");

            entity.HasMany(o => o.Items)
                  .WithOne(i => i.Order)
                  .HasForeignKey(i => i.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(o => o.BookingId);
            entity.HasIndex(o => o.Status);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.ToTable("order_items");
            entity.HasKey(i => i.Id);
            entity.Property(i => i.Id).HasColumnName("id");
            entity.Property(i => i.OrderId).HasColumnName("order_id");
            entity.Property(i => i.MenuItemId).HasColumnName("menu_item_id");
            entity.Property(i => i.Quantity).HasColumnName("quantity");
            entity.Property(i => i.UnitPrice).HasColumnName("unit_price");

            entity.HasOne(i => i.MenuItem)
                  .WithMany()
                  .HasForeignKey(i => i.MenuItemId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }
}