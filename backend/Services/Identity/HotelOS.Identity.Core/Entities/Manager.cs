namespace HotelOS.Identity.Core.Entities;

public class Manager : Account
{
    public string StaffId { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public int AccessLevel { get; set; } = 1;
    public Guid? ProfileId { get; set; }
    public StaffProfile? Profile { get; set; }
}