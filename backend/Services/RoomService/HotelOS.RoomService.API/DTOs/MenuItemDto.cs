namespace HotelOS.RoomService.API.DTOs;

public record CreateMenuItemRequest(
    string Name,
    string Description,
    double Price,
    string Category);

public record MenuItemResponse(
    Guid   Id,
    string Name,
    string Description,
    double Price,
    string Category,
    bool   IsAvailable);

public record UpdateMenuItemRequest(
    string Name,
    string Description,
    double Price,
    string Category);