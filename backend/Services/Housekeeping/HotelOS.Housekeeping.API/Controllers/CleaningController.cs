using HotelOS.Housekeeping.API.DTOs;
using HotelOS.Housekeeping.Core.Interfaces;
using HotelOS.Shared.Contracts.Events;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelOS.Housekeeping.API.Controllers;

[ApiController]
[Route("api/cleaning")]
public class CleaningController : ControllerBase
{
    private readonly IHousekeepingService _service;
    private readonly IPublishEndpoint     _broker;

    public CleaningController(
        IHousekeepingService service,
        IPublishEndpoint     broker)
    {
        _service = service;
        _broker  = broker;
    }

    [HttpPost("assign")]
    [Authorize(Roles = "Manager,Receptionist")]
    public async Task<IActionResult> Assign([FromBody] AssignCleaningRequest request)
    {
        var log = await _service.AssignCleaningAsync(
            request.RoomId, request.StaffId);
        return CreatedAtAction(nameof(GetById),
            new { id = log.Id }, Map(log));
    }

    /// <summary>POST api/cleaning/{id}/start — CleaningStaff starts</summary>
    [HttpPost("{id:guid}/start")]
    [Authorize(Roles = "CleaningStaff,Manager")]
    public async Task<IActionResult> Start(Guid id)
    {
        try
        {
            var log = await _service.StartCleaningAsync(id);
            return Ok(Map(log));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>POST api/cleaning/{id}/complete — CleaningStaff marks done</summary>
    [HttpPost("{id:guid}/complete")]
    [Authorize(Roles = "CleaningStaff,Manager")]
    public async Task<IActionResult> Complete(Guid id)
    {
        try
        {
            var log = await _service.MarkCleanAsync(id);

            // publish room.status.updated — room is now clean
            await _broker.Publish(new RoomStatusUpdatedEvent(
                log.RoomId,
                string.Empty,
                "Available",
                DateTime.UtcNow));

            return Ok(Map(log));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>GET api/cleaning/active</summary>
    [HttpGet("active")]
    [Authorize(Roles = "Manager,CleaningStaff,Receptionist")]
    public async Task<IActionResult> GetActive()
    {
        var logs = await _service.GetActiveLogsAsync();
        return Ok(logs.Select(Map));
    }

    /// <summary>GET api/cleaning/{id}</summary>
    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> GetById(Guid id)
    {
        var logs = await _service.GetActiveLogsAsync();
        var log  = logs.FirstOrDefault(l => l.Id == id);
        if (log is null) return NotFound();
        return Ok(Map(log));
    }

    /// <summary>GET api/cleaning/room/{roomId}</summary>
    [HttpGet("room/{roomId:guid}")]
    [Authorize]
    public async Task<IActionResult> GetByRoom(Guid roomId)
    {
        var logs = await _service.GetByRoomAsync(roomId);
        return Ok(logs.Select(Map));
    }

    private static CleaningLogResponse Map(
        Core.Entities.CleanlinessLog l) => new(
        l.Id, l.RoomId, l.StaffId,
        l.Status.ToString(),
        l.StartedAt, l.CompletedAt,
        l.DurationMins, l.Notes);
}