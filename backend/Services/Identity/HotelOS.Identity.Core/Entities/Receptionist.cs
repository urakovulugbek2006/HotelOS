namespace HotelOS.Identity.Core.Entities;

public class Receptionist : Account
{
    public string StaffId { get; set; } = string.Empty;
    public string Shift { get; set; } = string.Empty;
    public string DeskNumber { get; set; } = string.Empty;
    public Guid? ProfileId { get; set; }
    public StaffProfile? Profile { get; set; }
}