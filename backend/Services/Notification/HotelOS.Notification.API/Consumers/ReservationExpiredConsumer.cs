using HotelOS.Notification.API.Hubs;
using HotelOS.Shared.Contracts.Events;
using MassTransit;
using Microsoft.AspNetCore.SignalR;

namespace HotelOS.Notification.API.Consumers;

public class ReservationExpiredConsumer
    : IConsumer<ReservationExpiredEvent>
{
    private readonly IHubContext<HotelHub> _hub;
    private readonly ILogger<ReservationExpiredConsumer> _logger;

    public ReservationExpiredConsumer(
        IHubContext<HotelHub> hub,
        ILogger<ReservationExpiredConsumer> logger)
    {
        _hub    = hub;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<ReservationExpiredEvent> context)
    {
        var e = context.Message;
        _logger.LogInformation(
            "Reservation expired: {BookingId}", e.BookingId);

        // notify the guest their reservation timed out
        await _hub.Clients
            .Group($"user:{e.GuestId}")
            .SendAsync("ReservationExpired", new
            {
                e.BookingId,
                e.RoomId,
                e.OccurredAt
            });

        // room is available again — push to searching guests
        await _hub.Clients.Group("rooms").SendAsync("RoomStatusUpdated", new
        {
            e.RoomId,
            RoomNumber = string.Empty,
            NewStatus  = "Available",
            e.OccurredAt
        });
    }
}