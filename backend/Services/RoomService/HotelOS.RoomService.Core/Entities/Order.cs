using HotelOS.RoomService.Core.Enums;

namespace HotelOS.RoomService.Core.Entities;

public class Order
{
    public Guid        Id        { get; set; }
    public Guid        BookingId { get; set; }
    public Guid        RoomId    { get; set; }
    public Guid        GuestId   { get; set; }
    public OrderStatus Status    { get; set; } = OrderStatus.Received;
    public double      TotalPrice{ get; set; }
    public DateTime    CreatedAt { get; set; } = DateTime.UtcNow;

    public List<OrderItem> Items { get; set; } = new();

    public void UpdateStatus(OrderStatus status) => Status = status;
    public List<OrderItem> GetItems() => Items;
}