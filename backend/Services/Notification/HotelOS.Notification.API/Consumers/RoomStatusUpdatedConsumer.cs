using HotelOS.Notification.API.Hubs;
using HotelOS.Shared.Contracts.Events;
using MassTransit;
using Microsoft.AspNetCore.SignalR;

namespace HotelOS.Notification.API.Consumers;

public class RoomStatusUpdatedConsumer
    : IConsumer<RoomStatusUpdatedEvent>
{
    private readonly IHubContext<HotelHub> _hub;
    private readonly ILogger<RoomStatusUpdatedConsumer> _logger;

    public RoomStatusUpdatedConsumer(
        IHubContext<HotelHub> hub,
        ILogger<RoomStatusUpdatedConsumer> logger)
    {
        _hub    = hub;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<RoomStatusUpdatedEvent> context)
    {
        var e = context.Message;
        _logger.LogInformation(
            "Room status updated: {RoomId} → {Status}", e.RoomId, e.NewStatus);

        // push to all clients on the "rooms" channel
        await _hub.Clients.Group("rooms").SendAsync("RoomStatusUpdated", new
        {
            e.RoomId,
            e.RoomNumber,
            e.NewStatus,
            e.OccurredAt
        });
    }
}