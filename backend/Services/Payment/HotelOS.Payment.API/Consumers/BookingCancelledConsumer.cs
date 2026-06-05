using HotelOS.Payment.Core.Interfaces;
using HotelOS.Shared.Contracts.Events;
using MassTransit;

namespace HotelOS.Payment.API.Consumers;

public class BookingCancelledConsumer : IConsumer<BookingCancelledEvent>
{
    private readonly IPaymentService _service;
    private readonly ILogger<BookingCancelledConsumer> _logger;

    public BookingCancelledConsumer(
        IPaymentService service,
        ILogger<BookingCancelledConsumer> logger)
    {
        _service = service;
        _logger  = logger;
    }

    public async Task Consume(ConsumeContext<BookingCancelledEvent> context)
    {
        var e = context.Message;
        _logger.LogInformation(
            "Booking {BookingId} cancelled with penalty {Penalty}",
            e.BookingId, e.PenaltyType);

        // FullRefund → refund immediately
        // StandardPenalty → partial (treat as full refund for now)
        // NoRefund → do nothing
        if (e.PenaltyType is "FullRefund" or "StandardPenalty")
        {
            try
            {
                await _service.RefundPaymentAsync(e.BookingId);
                _logger.LogInformation(
                    "Refund processed for booking {BookingId}", e.BookingId);
            }
            catch (KeyNotFoundException)
            {
                _logger.LogInformation(
                    "No payment found for booking {BookingId} — skipping refund", e.BookingId);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(
                    "Cannot refund booking {BookingId}: {Reason}", e.BookingId, ex.Message);
            }
        }
    }
}
