namespace HotelOS.Reception.Core.Entities;

public class RoomKey
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public string Barcode { get; set; } = string.Empty;
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public bool Active { get; set; } = false;
    public bool IsMaster { get; set; } = false;

    public bool Activate() { Active = true;  return true; }
    public bool Deactivate() { Active = false; return true; }
}