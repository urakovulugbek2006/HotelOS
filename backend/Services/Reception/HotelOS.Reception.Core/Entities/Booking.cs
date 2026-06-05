using HotelOS.Reception.Core.Enums;

namespace HotelOS.Reception.Core.Entities;

public class Booking
{
    public Guid Id { get; set; }
    public Guid GuestId { get; set; }
    public Guid RoomId { get; set; }
    public DateTime CheckIn { get; set; }
    public DateTime CheckOut { get; set; }

    // effectiveCheckout = CheckOut + buffer
    // computed when booking is created/confirmed
    public DateTime EffectiveCheckout { get; set; }

    public BookingStatus Status { get; set; } = BookingStatus.PendingPayment;
    public double TotalPrice { get; set; }
    public CancellationPenalty PenaltyType { get; set; } = CancellationPenalty.FullRefund;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }  // 10-min payment window

    // navigation
    public Room? Room { get; set; }

    /// <summary>
    /// Returns true if this booking's [CheckIn, EffectiveCheckout]
    /// window overlaps the requested range.
    /// </summary>
    public bool Overlaps(DateTime wantedIn, DateTime wantedOut)
        => wantedIn < EffectiveCheckout && wantedOut > CheckIn;
}