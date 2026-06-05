namespace HotelOS.RoomService.Core.Entities;

public class OrderItem
{
    public Guid   Id         { get; set; }
    public Guid   OrderId    { get; set; }
    public Guid   MenuItemId { get; set; }
    public int    Quantity   { get; set; }
    public double UnitPrice  { get; set; }

    public Order?    Order    { get; set; }
    public MenuItem? MenuItem { get; set; }

    public double GetSubtotal() => Quantity * UnitPrice;
}