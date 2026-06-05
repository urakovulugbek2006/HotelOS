using HotelOS.Reception.API.DTOs;
using HotelOS.Reception.Core.Entities;
using HotelOS.Reception.Core.Enums;
using HotelOS.Reception.Core.Interfaces;
using HotelOS.Shared.Contracts.Events;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HotelOS.Reception.API.Controllers;

[ApiController]
[Route("api/rooms")]
public class RoomController : ControllerBase
{
    private readonly IReceptionService _service;
    private readonly IPublishEndpoint  _broker;

    public RoomController(IReceptionService service, IPublishEndpoint broker)
    {
        _service = service;
        _broker  = broker;
    }

    /// <summary>GET api/rooms?status=Available — Manager / Receptionist</summary>
    [HttpGet]
    [Authorize(Roles = "Manager,Receptionist")]
    public async Task<IActionResult> GetAll([FromQuery] RoomStatus? status)
    {
        var rooms = await _service.GetAllRoomsAsync(status);
        return Ok(rooms.Select(r => new RoomResponse(
            r.Id, r.RoomNumber, r.Floor,
            r.Style.ToString(), r.Status.ToString(),
            r.PricePerNight, r.Capacity,
            r.IsSmokingAllowed, r.Description,
            r.GetNextAvailableDate())));
    }

    /// <summary>GET api/rooms/search?style=Deluxe&checkIn=...&checkOut=...</summary>
    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] RoomStyle? style,
        [FromQuery] DateTime   checkIn,
        [FromQuery] DateTime   checkOut)
    {
        try
        {
            var rooms = await _service.SearchAvailableRoomsAsync(
                style, checkIn, checkOut);

            var result = rooms.Select(r => new RoomResponse(
                r.Id, r.RoomNumber, r.Floor,
                r.Style.ToString(), r.Status.ToString(),
                r.PricePerNight, r.Capacity,
                r.IsSmokingAllowed, r.Description,
                r.GetNextAvailableDate()));

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>GET api/rooms/{id}</summary>
    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> GetById(Guid id)
    {
        var room = await _service.GetRoomAsync(id);
        if (room is null) return NotFound();
        return Ok(room);
    }

    /// <summary>POST api/rooms — Manager only</summary>
    [HttpPost]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Create([FromBody] CreateRoomRequest request)
    {
        var room = new Room
        {
            RoomNumber      = request.RoomNumber,
            Floor           = request.Floor,
            Style           = request.Style,
            PricePerNight   = request.PricePerNight,
            Capacity        = request.Capacity,
            IsSmokingAllowed= request.IsSmokingAllowed,
            Description     = request.Description,
            Status          = RoomStatus.Available
        };

        var created = await _service.CreateRoomAsync(room);

        await _broker.Publish(new RoomStatusUpdatedEvent(
            created.Id, created.RoomNumber,
            created.Status.ToString(), DateTime.UtcNow));

        return CreatedAtAction(nameof(GetById),
            new { id = created.Id },
            new { created.Id, created.RoomNumber, created.Status });
    }

    /// <summary>PATCH api/rooms/{id}/status — Receptionist / Manager</summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "Receptionist,Manager")]
    public async Task<IActionResult> UpdateStatus(
        Guid id, [FromBody] UpdateRoomStatusRequest request)
    {
        try
        {
            if (!Enum.TryParse<RoomStatus>(request.Status, out var status))
                return BadRequest(new { message = "Invalid room status." });

            if (status == RoomStatus.Active || status == RoomStatus.Reserved)
                return BadRequest(new { message = "Cannot set Active or Reserved directly. Use booking flow." });

            await _service.UpdateRoomStatusAsync(id, status);

            await _broker.Publish(new RoomStatusUpdatedEvent(
                id, string.Empty, status.ToString(), DateTime.UtcNow));

            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>PATCH api/rooms/{id}/buffer — Manager updates cleaning/maintenance buffer</summary>
    [HttpPatch("{id:guid}/buffer")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> UpdateBuffer(
        Guid id, [FromBody] UpdateBufferRequest request)
    {
        try
        {
            if (!Enum.TryParse<HotelOS.Reception.Core.Enums.BufferType>(
                    request.BufferType, out var bufferType))
                return BadRequest(new { message = "Invalid BufferType value." });

            var managerId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

            await _service.UpdateRoomBufferAsync(
                id,
                request.CleaningBufferMins,
                request.MaintenanceBufferMins,
                bufferType,
                managerId);

            var room = await _service.GetRoomAsync(id);
            var cfg  = room!.BufferConfig;

            return Ok(new BufferResponse(
                id,
                cfg.CleaningBufferMins,
                cfg.MaintenanceBufferMins,
                cfg.BufferType.ToString(),
                cfg.UpdatedAt));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>PATCH api/rooms/{id}/restore — Manager only, sets Archived → Available</summary>
    [HttpPatch("{id:guid}/restore")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Restore(Guid id)
    {
        try
        {
            await _service.RestoreRoomAsync(id);
            await _broker.Publish(new RoomStatusUpdatedEvent(
                id, string.Empty, RoomStatus.Available.ToString(), DateTime.UtcNow));
            return NoContent();
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

    /// <summary>DELETE api/rooms/{id} — Manager only (soft delete)</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Archive(Guid id)
    {
        await _service.UpdateRoomStatusAsync(id, RoomStatus.Archived);
        return NoContent();
    }
}