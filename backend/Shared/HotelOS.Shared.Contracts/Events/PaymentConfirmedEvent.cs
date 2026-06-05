namespace HotelOS.Shared.Contracts.Events;

public record PaymentConfirmedEvent(
    Guid     BookingId,
    Guid     GuestId,
    Guid     PaymentId,
    string   GatewayRef,
    DateTime OccurredAt);