using HotelOS.RoomService.API.DTOs;
using HotelOS.RoomService.Core.Interfaces;
using HotelOS.Shared.Contracts.Events;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HotelOS.RoomService.API.Controllers;

[ApiController]
[Route("api/orders")]
public class OrderController : ControllerBase
{
    private readonly IRoomServiceService _service;
    private readonly IPublishEndpoint    _broker;

    public OrderController(IRoomServiceService service, IPublishEndpoint broker)
    {
        _service = service;
        _broker  = broker;
    }

    /// <summary>POST api/orders — Guest places order</summary>
    [HttpPost]
    [Authorize(Roles = "Client")]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest request)
    {
        try
        {
            var guestId = Guid.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var items = request.Items
                .Select(i => (i.MenuItemId, i.Quantity))
                .ToList();

            var order = await _service.CreateOrderAsync(
                request.BookingId, request.RoomId, guestId, items);

            await _broker.Publish(new OrderCreatedEvent(
                order.Id, order.BookingId, order.RoomId,
                order.GuestId, order.TotalPrice, DateTime.UtcNow));

            return CreatedAtAction(nameof(GetById),
                new { id = order.Id }, MapOrder(order));
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

    /// <summary>GET api/orders/{id}</summary>
    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> GetById(Guid id)
    {
        var order = await _service.GetOrderByIdAsync(id);
        if (order is null) return NotFound();
        return Ok(MapOrder(order));
    }

    /// <summary>GET api/orders/booking/{bookingId} — Guest's orders for a booking</summary>
    [HttpGet("booking/{bookingId:guid}")]
    [Authorize]
    public async Task<IActionResult> GetByBooking(Guid bookingId)
    {
        var orders = await _service.GetOrdersByBookingIdAsync(bookingId);
        return Ok(orders.Select(MapOrder));
    }

    /// <summary>GET api/orders/active — Kitchen dashboard</summary>
    [HttpGet("active")]
    [Authorize(Roles = "KitchenStaff,Manager,Server")]
    public async Task<IActionResult> GetActive()
    {
        var orders = await _service.GetActiveOrdersAsync();
        return Ok(orders.Select(MapOrder));
    }

    /// <summary>PATCH api/orders/{id}/status — KitchenStaff/Server updates status</summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "KitchenStaff,Server,Manager")]
    public async Task<IActionResult> UpdateStatus(
        Guid id, [FromBody] UpdateOrderStatusRequest request)
    {
        try
        {
            var order = await _service.UpdateOrderStatusAsync(id, request.Status);

            await _broker.Publish(new OrderUpdatedEvent(
                order.Id, request.Status.ToString(), DateTime.UtcNow));

            return Ok(MapOrder(order));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    private static OrderResponse MapOrder(Core.Entities.Order o) => new(
        o.Id, o.BookingId, o.RoomId, o.GuestId,
        o.Status.ToString(), o.TotalPrice, o.CreatedAt,
        o.Items.Select(i => new OrderItemResponse(
            i.MenuItemId,
            i.MenuItem?.Name ?? string.Empty,
            i.Quantity, i.UnitPrice,
            i.GetSubtotal())).ToList());
}