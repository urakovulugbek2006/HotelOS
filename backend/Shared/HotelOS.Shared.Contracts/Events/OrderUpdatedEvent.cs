namespace HotelOS.Shared.Contracts.Events;

public record OrderUpdatedEvent(
    Guid     OrderId,
    string   NewStatus,
    DateTime OccurredAt);