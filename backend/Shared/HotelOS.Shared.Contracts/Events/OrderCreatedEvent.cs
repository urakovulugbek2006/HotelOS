namespace HotelOS.Shared.Contracts.Events;

public record OrderCreatedEvent(
    Guid     OrderId,
    Guid     BookingId,
    Guid     RoomId,
    Guid     GuestId,
    double   TotalPrice,
    DateTime OccurredAt);