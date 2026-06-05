namespace HotelOS.Shared.Contracts.Events;

public record BookingCancelledEvent(
    Guid     BookingId,
    Guid     GuestId,
    string   PenaltyType,   // FullRefund | StandardPenalty | NoRefund
    DateTime OccurredAt);
