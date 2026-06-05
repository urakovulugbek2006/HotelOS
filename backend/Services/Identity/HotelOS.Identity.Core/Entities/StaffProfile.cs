namespace HotelOS.Identity.Core.Entities;

public class StaffProfile
{
    public Guid Id { get; set; }
    public Guid AccountId { get; set; }   // FK to Account.Id
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string EmergencyContactName { get; set; } = string.Empty;
    public string EmergencyContactPhone { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public DateTime HireDate { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // owned entity
    public Address? Address { get; set; }

    public string GetFullName() => $"{FirstName} {LastName}";
}