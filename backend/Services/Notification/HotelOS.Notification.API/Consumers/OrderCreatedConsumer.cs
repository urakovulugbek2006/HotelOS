using HotelOS.Notification.API.Hubs;
using HotelOS.Shared.Contracts.Events;
using MassTransit;
using Microsoft.AspNetCore.SignalR;

namespace HotelOS.Notification.API.Consumers;

public class OrderCreatedConsumer : IConsumer<OrderCreatedEvent>
{
    private readonly IHubContext<HotelHub> _hub;
    private readonly ILogger<OrderCreatedConsumer> _logger;

    public OrderCreatedConsumer(
        IHubContext<HotelHub> hub,
        ILogger<OrderCreatedConsumer> logger)
    {
        _hub    = hub;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<OrderCreatedEvent> context)
    {
        var e = context.Message;
        _logger.LogInformation(
            "Order created: {OrderId} for room {RoomId}", 
            e.OrderId, e.RoomId);

        // push to kitchen channel — new order card appears
        await _hub.Clients.Group("kitchen").SendAsync("OrderCreated", new
        {
            e.OrderId,
            e.BookingId,
            e.RoomId,
            e.GuestId,
            e.TotalPrice,
            e.OccurredAt
        });
    }
}