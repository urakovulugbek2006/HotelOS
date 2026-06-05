using HotelOS.Reception.Core.Enums;

namespace HotelOS.Reception.Core.Entities;

public class Room
{
    public Guid Id { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public int Floor { get; set; }
    public RoomStyle Style { get; set; }
    public RoomStatus Status { get; set; } = RoomStatus.Available;
    public double PricePerNight { get; set; }
    public int Capacity { get; set; }
    public bool IsSmokingAllowed { get; set; } = false;
    public string Description { get; set; } = string.Empty;

    // buffer config — owned by this room
    public RoomBufferConfig BufferConfig { get; set; } = new();

    // all future bookings for date-range availability checks
    public List<Booking> Bookings { get; set; } = new();

    // keys issued for this room
    public List<RoomKey> Keys { get; set; } = new();

    /// <summary>
    /// Core availability algorithm.
    /// Returns true if room can be booked for [wantedCheckIn, wantedCheckOut].
    /// Accounts for cleaning + maintenance buffer between consecutive stays.
    /// </summary>
    public bool IsAvailable(DateTime wantedIn, DateTime wantedOut,
        bool hasActiveMaintenanceTicket = false)
    {
        // 1. hard-blocked statuses — cannot accept any new booking
        if (Status == RoomStatus.Reserved) return false;
        if (Status == RoomStatus.Active)   return false;
        if (Status == RoomStatus.OOS)      return false;
        if (Status == RoomStatus.Archived) return false;

        // 2. compute effectiveCheckout for each active booking and check overlap
        foreach (var booking in Bookings)
        {
            if (booking.Status is not (BookingStatus.PendingPayment
                or BookingStatus.Confirmed
                or BookingStatus.Active))
                continue;

            // effectiveCheckout already stored on the booking,
            // but we recompute here for correctness
            var effectiveEnd = BufferConfig.GetEarliestNextCheckIn(
                booking.CheckOut, hasActiveMaintenanceTicket);

            if (wantedIn < effectiveEnd && wantedOut > booking.CheckIn)
                return false;  // overlap found — room is blocked
        }

        return true;
    }

    /// <summary>
    /// Returns the earliest DateTime a new booking can start,
    /// after the last active booking (including buffer).
    /// </summary>
    public DateTime GetNextAvailableDate(bool hasActiveTicket = false)
    {
        var lastEnd = Bookings
            .Where(b => b.Status is BookingStatus.PendingPayment
                     or BookingStatus.Confirmed
                     or BookingStatus.Active)
            .OrderByDescending(b => b.CheckOut)
            .FirstOrDefault()?.CheckOut ?? DateTime.UtcNow;

        return BufferConfig.GetEarliestNextCheckIn(lastEnd, hasActiveTicket);
    }

    public void UpdateStatus(RoomStatus newStatus)
        => Status = newStatus;
}