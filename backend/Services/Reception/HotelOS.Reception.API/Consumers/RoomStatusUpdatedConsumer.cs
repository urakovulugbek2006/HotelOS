using HotelOS.Reception.Core.Enums;
using HotelOS.Reception.Core.Interfaces;
using HotelOS.Shared.Contracts.Events;
using MassTransit;

namespace HotelOS.Reception.API.Consumers;

public class RoomStatusUpdatedConsumer : IConsumer<RoomStatusUpdatedEvent>
{
    private readonly IReceptionService _service;
    private readonly ILogger<RoomStatusUpdatedConsumer> _logger;

    public RoomStatusUpdatedConsumer(
        IReceptionService service,
        ILogger<RoomStatusUpdatedConsumer> logger)
    {
        _service = service;
        _logger  = logger;
    }

    public async Task Consume(ConsumeContext<RoomStatusUpdatedEvent> context)
    {
        var e = context.Message;

        if (!Enum.TryParse<RoomStatus>(e.NewStatus, out var status))
        {
            _logger.LogWarning("Unknown RoomStatus value '{Status}' — skipping", e.NewStatus);
            return;
        }

        // Reception owns Reserved and Active — never let external events overwrite them
        if (status is RoomStatus.Reserved or RoomStatus.Active)
        {
            _logger.LogDebug(
                "Ignoring external RoomStatusUpdated for room {RoomId}: status {Status} is managed by Reception",
                e.RoomId, status);
            return;
        }

        _logger.LogInformation(
            "Room {RoomNumber} ({RoomId}) status → {Status}", e.RoomNumber, e.RoomId, status);

        try
        {
            await _service.UpdateRoomStatusAsync(e.RoomId, status);
        }
        catch (KeyNotFoundException)
        {
            _logger.LogWarning("Room {RoomId} not found in Reception DB — skipping", e.RoomId);
        }
    }
}
