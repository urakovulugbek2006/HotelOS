using HotelOS.Reception.Core.Interfaces;
using HotelOS.Shared.Contracts.Events;
using MassTransit;

namespace HotelOS.Reception.API.Consumers;

public class PaymentConfirmedConsumer : IConsumer<PaymentConfirmedEvent>
{
    private readonly IReceptionService _service;
    private readonly ILogger<PaymentConfirmedConsumer> _logger;

    public PaymentConfirmedConsumer(
        IReceptionService service,
        ILogger<PaymentConfirmedConsumer> logger)
    {
        _service = service;
        _logger  = logger;
    }

    public async Task Consume(ConsumeContext<PaymentConfirmedEvent> context)
    {
        var e = context.Message;
        _logger.LogInformation(
            "Payment confirmed for booking {BookingId} — confirming reservation", e.BookingId);

        try
        {
            await _service.ConfirmReservationAsync(e.BookingId);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(
                "Could not confirm booking {BookingId}: {Reason}", e.BookingId, ex.Message);
        }
        catch (KeyNotFoundException)
        {
            _logger.LogWarning("Booking {BookingId} not found — skipping", e.BookingId);
        }
    }
}
