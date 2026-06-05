using HotelOS.Notification.API.Hubs;
using HotelOS.Shared.Contracts.Events;
using MassTransit;
using Microsoft.AspNetCore.SignalR;

namespace HotelOS.Notification.API.Consumers;

public class PaymentConfirmedConsumer : IConsumer<PaymentConfirmedEvent>
{
    private readonly IHubContext<HotelHub> _hub;
    private readonly ILogger<PaymentConfirmedConsumer> _logger;

    public PaymentConfirmedConsumer(
        IHubContext<HotelHub> hub,
        ILogger<PaymentConfirmedConsumer> logger)
    {
        _hub    = hub;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<PaymentConfirmedEvent> context)
    {
        var e = context.Message;
        _logger.LogInformation(
            "Payment confirmed: booking {BookingId} guest {GuestId}", e.BookingId, e.GuestId);

        var payload = new { e.BookingId, e.PaymentId, e.OccurredAt };

        // push to guest's personal channel
        await _hub.Clients
            .Group($"user:{e.GuestId}")
            .SendAsync("PaymentConfirmed", payload);

        // push to staff (bookings group) so reception dashboard updates
        await _hub.Clients
            .Group("bookings")
            .SendAsync("PaymentConfirmed", payload);
    }
}
