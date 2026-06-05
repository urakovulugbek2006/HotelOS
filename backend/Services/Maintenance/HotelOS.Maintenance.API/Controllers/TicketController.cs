using HotelOS.Maintenance.API.DTOs;
using HotelOS.Maintenance.Core.Interfaces;
using HotelOS.Shared.Contracts.Events;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HotelOS.Maintenance.API.Controllers;

[ApiController]
[Route("api/tickets")]
public class TicketController : ControllerBase
{
    private readonly IMaintenanceService _service;
    private readonly IPublishEndpoint    _broker;

    public TicketController(
        IMaintenanceService service,
        IPublishEndpoint    broker)
    {
        _service = service;
        _broker  = broker;
    }

    [HttpPost]
    [Authorize(Roles = "Receptionist,Manager")]
    public async Task<IActionResult> Create([FromBody] CreateTicketRequest request)
    {
        var reportedBy = Guid.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var ticket = await _service.CreateTicketAsync(
            request.RoomId, reportedBy,
            request.Description, request.Priority,
            request.EstimatedMins);

        // publish so Notification Service can alert maintenance staff
        await _broker.Publish(new RoomStatusUpdatedEvent(
            ticket.RoomId, string.Empty, "OOS", DateTime.UtcNow));

        return CreatedAtAction(nameof(GetById),
            new { id = ticket.Id }, Map(ticket));
    }

    /// <summary>POST api/tickets/{id}/assign — Manager assigns staff</summary>
    [HttpPost("{id:guid}/assign")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Assign(
        Guid id, [FromBody] AssignStaffRequest request)
    {
        try
        {
            var ticket = await _service.AssignStaffAsync(id, request.StaffId);
            return Ok(Map(ticket));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>POST api/tickets/{id}/resolve — MaintenanceStaff resolves</summary>
    [HttpPost("{id:guid}/resolve")]
    [Authorize(Roles = "MaintenanceStaff,Manager")]
    public async Task<IActionResult> Resolve(Guid id)
    {
        try
        {
            var ticket = await _service.ResolveTicketAsync(id);

            // publish room status back to Available after maintenance
            await _broker.Publish(new RoomStatusUpdatedEvent(
                ticket.RoomId, string.Empty,
                "Available", DateTime.UtcNow));

            return Ok(Map(ticket));
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

    /// <summary>GET api/tickets/active</summary>
    [HttpGet("active")]
    [Authorize(Roles = "Manager,MaintenanceStaff,Receptionist")]
    public async Task<IActionResult> GetActive()
    {
        var tickets = await _service.GetActiveTicketsAsync();
        return Ok(tickets.Select(Map));
    }

    /// <summary>GET api/tickets/{id}</summary>
    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> GetById(Guid id)
    {
        var ticket = await _service.GetByIdAsync(id);
        if (ticket is null) return NotFound();
        return Ok(Map(ticket));
    }

    /// <summary>GET api/tickets/room/{roomId}</summary>
    [HttpGet("room/{roomId:guid}")]
    [Authorize]
    public async Task<IActionResult> GetByRoom(Guid roomId)
    {
        var tickets = await _service.GetByRoomAsync(roomId);
        return Ok(tickets.Select(Map));
    }

    private static TicketResponse Map(Core.Entities.MaintenanceTicket t) => new(
        t.Id, t.RoomId, t.ReportedBy,
        t.Description, t.Priority, t.Status,
        t.EstimatedMins, t.AssignedStaffId,
        t.CreatedAt, t.ResolvedAt);
}