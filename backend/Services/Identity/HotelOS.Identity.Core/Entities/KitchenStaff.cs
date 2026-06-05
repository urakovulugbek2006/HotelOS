namespace HotelOS.Identity.Core.Entities;

public class KitchenStaff : Account
{
    public string StaffId { get; set; } = string.Empty;
    public string Station { get; set; } = string.Empty;
    public Guid? ProfileId { get; set; }
    public StaffProfile? Profile { get; set; }
}