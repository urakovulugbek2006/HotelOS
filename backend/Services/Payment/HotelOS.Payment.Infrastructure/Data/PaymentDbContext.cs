using HotelOS.Payment.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace HotelOS.Payment.Infrastructure.Data;

public class PaymentDbContext : DbContext
{
    public PaymentDbContext(DbContextOptions<PaymentDbContext> options)
        : base(options)
    {
    }

    public DbSet<PaymentRecord> Payments => Set<PaymentRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<PaymentRecord>(entity =>
        {
            entity.ToTable("payments");
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Id).HasColumnName("id");
            entity.Property(p => p.BookingId).HasColumnName("booking_id").IsRequired();
            entity.Property(p => p.GuestId).HasColumnName("guest_id").IsRequired();
            entity.Property(p => p.Amount).HasColumnName("amount");
            entity.Property(p => p.Currency).HasColumnName("currency").HasMaxLength(8);
            entity.Property(p => p.Status).HasColumnName("status")
                .HasConversion<string>().HasMaxLength(32);
            entity.Property(p => p.StripePaymentIntentId)
                .HasColumnName("stripe_payment_intent_id").HasMaxLength(256);
            entity.Property(p => p.StripeClientSecret)
                .HasColumnName("stripe_client_secret").HasMaxLength(512);
            entity.Property(p => p.GatewayRef)
                .HasColumnName("gateway_ref").HasMaxLength(256);
            entity.Property(p => p.FailureReason)
                .HasColumnName("failure_reason").HasMaxLength(512);
            entity.Property(p => p.CreatedAt).HasColumnName("created_at");
            entity.Property(p => p.CompletedAt).HasColumnName("completed_at");
            entity.HasIndex(p => p.BookingId).IsUnique();
            entity.HasIndex(p => p.StripePaymentIntentId);
            entity.Property(p => p.Penalty)
                .HasColumnName("penalty")
                .HasConversion<string>()
                .HasMaxLength(32);
        });
    }
}