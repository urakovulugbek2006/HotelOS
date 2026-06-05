using HotelOS.RoomService.Core.Enums;

namespace HotelOS.RoomService.API.DTOs;

public record OrderItemRequest(Guid MenuItemId, int Quantity);

public record CreateOrderRequest(
    Guid BookingId,
    Guid RoomId,
    List<OrderItemRequest> Items);

public record UpdateOrderStatusRequest(OrderStatus Status);

public record OrderItemResponse(
    Guid   MenuItemId,
    string MenuItemName,
    int    Quantity,
    double UnitPrice,
    double Subtotal);

public record OrderResponse(
    Guid     Id,
    Guid     BookingId,
    Guid     RoomId,
    Guid     GuestId,
    string   Status,
    double   TotalPrice,
    DateTime CreatedAt,
    List<OrderItemResponse> Items);