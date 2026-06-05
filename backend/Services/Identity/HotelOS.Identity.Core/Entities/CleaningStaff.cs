namespace HotelOS.Identity.Core.Entities;

public class CleaningStaff : Account
{
    public string StaffId { get; set; } = string.Empty;
    public string? CurrentAssignment { get; set; }
    public Guid? ProfileId { get; set; }
    public StaffProfile? Profile { get; set; }
}