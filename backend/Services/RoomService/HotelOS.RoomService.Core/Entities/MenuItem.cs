namespace HotelOS.RoomService.Core.Entities;

public class MenuItem
{
    public Guid   Id          { get; set; }
    public string Name        { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double Price       { get; set; }
    public string Category    { get; set; } = string.Empty;
    public bool   IsAvailable { get; set; } = true;

    public void Toggle() => IsAvailable = !IsAvailable;
}