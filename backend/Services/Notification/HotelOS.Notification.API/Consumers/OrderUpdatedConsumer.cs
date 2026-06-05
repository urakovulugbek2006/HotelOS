using HotelOS.Notification.API.Hubs;
using HotelOS.Shared.Contracts.Events;
using MassTransit;
using Microsoft.AspNetCore.SignalR;

namespace HotelOS.Notification.API.Consumers;

public class OrderUpdatedConsumer : IConsumer<OrderUpdatedEvent>
{
    private readonly IHubContext<HotelHub> _hub;
    private readonly ILogger<OrderUpdatedConsumer> _logger;

    public OrderUpdatedConsumer(
        IHubContext<HotelHub> hub,
        ILogger<OrderUpdatedConsumer> logger)
    {
        _hub    = hub;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<OrderUpdatedEvent> context)
    {
        var e = context.Message;
        _logger.LogInformation(
            "Order updated: {OrderId} → {Status}", e.OrderId, e.NewStatus);

        // push to server channel when order is ready for delivery
        if (e.NewStatus == "OutForDelivery")
            await _hub.Clients.Group("server").SendAsync("OrderReadyForDelivery", new
            {
                e.OrderId,
                e.NewStatus,
                e.OccurredAt
            });

        // always push to kitchen for state sync
        await _hub.Clients.Group("kitchen").SendAsync("OrderUpdated", new
        {
            e.OrderId,
            e.NewStatus,
            e.OccurredAt
        });
    }
}