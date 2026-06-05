namespace HotelOS.Shared.Contracts.Events;

public record RoomStatusUpdatedEvent(
    Guid     RoomId,
    string   RoomNumber,
    string   NewStatus,
    DateTime OccurredAt);