namespace HotelOS.Shared.Contracts.Events;

public record RoomVacatedEvent(
    Guid     RoomId,
    string   RoomNumber,
    Guid     BookingId,
    Guid     GuestId,
    DateTime OccurredAt);