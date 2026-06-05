using HotelOS.Housekeeping.Core.Interfaces;
using HotelOS.Shared.Contracts.Events;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace HotelOS.Housekeeping.API.Consumers;

public class RoomVacatedConsumer : IConsumer<RoomVacatedEvent>
{
    private readonly IHousekeepingService _service;
    private readonly ILogger<RoomVacatedConsumer> _logger;

    public RoomVacatedConsumer(
        IHousekeepingService service,
        ILogger<RoomVacatedConsumer> logger)
    {
        _service = service;
        _logger  = logger;
    }

    public async Task Consume(ConsumeContext<RoomVacatedEvent> context)
    {
        var e = context.Message;
        _logger.LogInformation(
            "Room vacated: {RoomId} — auto-assigning cleaning", e.RoomId);

        // auto-assign cleaning log when room is vacated
        // StaffId is zero here — manager assigns staff via API
        await _service.AssignCleaningAsync(e.RoomId, Guid.Empty);

        // notify Reception so it can update room status to Cleaning
        await context.Publish(new RoomStatusUpdatedEvent(
            e.RoomId, e.RoomNumber, "Cleaning", DateTime.UtcNow));
    }
}