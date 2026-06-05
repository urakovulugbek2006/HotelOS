using HotelOS.Notification.API.Hubs;
using HotelOS.Shared.Contracts.Events;
using MassTransit;
using Microsoft.AspNetCore.SignalR;

namespace HotelOS.Notification.API.Consumers;

public class RoomVacatedConsumer : IConsumer<RoomVacatedEvent>
{
    private readonly IHubContext<HotelHub> _hub;
    private readonly ILogger<RoomVacatedConsumer> _logger;

    public RoomVacatedConsumer(
        IHubContext<HotelHub> hub,
        ILogger<RoomVacatedConsumer> logger)
    {
        _hub    = hub;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<RoomVacatedEvent> context)
    {
        var e = context.Message;
        _logger.LogInformation(
            "Room vacated: {RoomId}, booking {BookingId}", 
            e.RoomId, e.BookingId);

        // push to housekeeping channel — assigned staff sees it
        await _hub.Clients.Group("housekeeping").SendAsync("RoomVacated", new
        {
            e.RoomId,
            e.RoomNumber,
            e.BookingId,
            e.OccurredAt
        });
    }
}