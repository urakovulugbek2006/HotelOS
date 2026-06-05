using HotelOS.Notification.API.Hubs;
using HotelOS.Shared.Contracts.Events;
using MassTransit;
using Microsoft.AspNetCore.SignalR;

namespace HotelOS.Notification.API.Consumers;

public class BookingStatusUpdatedConsumer : IConsumer<BookingStatusUpdatedEvent>
{
    private readonly IHubContext<HotelHub> _hub;
    private readonly ILogger<BookingStatusUpdatedConsumer> _logger;

    public BookingStatusUpdatedConsumer(
        IHubContext<HotelHub> hub,
        ILogger<BookingStatusUpdatedConsumer> logger)
    {
        _hub    = hub;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<BookingStatusUpdatedEvent> context)
    {
        var e = context.Message;
        _logger.LogInformation(
            "Booking status updated: {BookingId} → {Status}", e.BookingId, e.NewBookingStatus);

        var payload = new
        {
            e.BookingId,
            e.RoomId,
            e.NewBookingStatus,
            e.OccurredAt
        };

        // staff dashboard
        await _hub.Clients.Group("bookings").SendAsync("BookingStatusUpdated", payload);

        // guest's personal channel so their dashboard updates in real-time
        await _hub.Clients
            .Group($"user:{e.GuestId}")
            .SendAsync("BookingStatusUpdated", payload);
    }
}
