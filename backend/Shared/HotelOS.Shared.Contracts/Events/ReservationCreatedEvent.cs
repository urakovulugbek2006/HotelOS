namespace HotelOS.Shared.Contracts.Events;

public record ReservationCreatedEvent(
    Guid   BookingId,
    Guid   GuestId,
    Guid   RoomId,
    DateTime CheckIn,
    DateTime CheckOut,
    double TotalPrice,
    DateTime ExpiresAt,
    DateTime OccurredAt);