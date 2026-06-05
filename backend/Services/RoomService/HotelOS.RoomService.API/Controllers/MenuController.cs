using HotelOS.RoomService.API.DTOs;
using HotelOS.RoomService.Core.Entities;
using HotelOS.RoomService.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelOS.RoomService.API.Controllers;

[ApiController]
[Route("api/menu")]
public class MenuController : ControllerBase
{
    private readonly IRoomServiceService _service;

    public MenuController(IRoomServiceService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetMenu()
    {
        var items = await _service.GetMenuAsync();
        return Ok(items.Select(MapItem));
    }

    /// <summary>GET api/menu/{id}</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var item = await _service.GetMenuItemByIdAsync(id);
        return item is null ? NotFound() : Ok(MapItem(item));
    }

    /// <summary>PUT api/menu/{id} — Manager updates item</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Update(
        Guid id, [FromBody] UpdateMenuItemRequest request)
    {
        try
        {
            var item = await _service.UpdateMenuItemAsync(
                id, request.Name, request.Description,
                request.Price, request.Category);
            return Ok(MapItem(item));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>POST api/menu — Manager adds item</summary>
    [HttpPost]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> AddItem([FromBody] CreateMenuItemRequest request)
    {
        var item = new MenuItem
        {
            Name        = request.Name,
            Description = request.Description,
            Price       = request.Price,
            Category    = request.Category,
            IsAvailable = true
        };

        var created = await _service.AddMenuItemAsync(item);
        return CreatedAtAction(nameof(GetMenu),
            new { id = created.Id }, MapItem(created));
    }

    /// <summary>PATCH api/menu/{id}/toggle — Manager toggles availability</summary>
    [HttpPatch("{id:guid}/toggle")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Toggle(Guid id)
    {
        try
        {
            var item = await _service.ToggleMenuItemAsync(id);
            return Ok(MapItem(item));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    private static MenuItemResponse MapItem(MenuItem m) => new(
        m.Id, m.Name, m.Description, m.Price, m.Category, m.IsAvailable);
}