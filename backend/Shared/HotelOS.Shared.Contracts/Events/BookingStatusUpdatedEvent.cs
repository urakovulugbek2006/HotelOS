namespace HotelOS.Shared.Contracts.Events;

public record BookingStatusUpdatedEvent(
    Guid     BookingId,
    Guid     GuestId,
    Guid     RoomId,
    string   NewBookingStatus,
    DateTime OccurredAt);
