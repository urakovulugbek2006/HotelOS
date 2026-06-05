namespace HotelOS.Identity.Core.Entities;

public class MaintenanceStaff : Account
{
    public string StaffId { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public Guid? ProfileId { get; set; }
    public StaffProfile? Profile { get; set; }
}