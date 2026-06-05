using HotelOS.Payment.Core.Enums;

namespace HotelOS.Payment.Core.Entities;

public class PaymentRecord
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public Guid GuestId { get; set; }
    public double Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public CancellationPenalty Penalty { get; set; } = CancellationPenalty.FullRefund;
    public string? StripePaymentIntentId { get; set; }
    public string? StripeClientSecret { get; set; }
    public string? GatewayRef { get; set; }
    public string? FailureReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}