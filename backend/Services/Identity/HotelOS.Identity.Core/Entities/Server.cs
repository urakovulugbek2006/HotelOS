namespace HotelOS.Identity.Core.Entities;

public class Server : Account
{
    public string StaffId { get; set; } = string.Empty;
    public string Zone { get; set; } = string.Empty;
    public Guid? ProfileId { get; set; }
    public StaffProfile? Profile { get; set; }
}