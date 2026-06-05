namespace HotelOS.Shared.Contracts.Events;

public record ReservationExpiredEvent(
    Guid     BookingId,
    Guid     RoomId,
    Guid     GuestId,
    DateTime OccurredAt);