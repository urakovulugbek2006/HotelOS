namespace HotelOS.Identity.Core.Entities;

public class Client : Account
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public int LoyaltyPoints { get; set; } = 0;
    public string? PreferredPaymentMethod { get; set; }

    // owned entity — stored in same table
    public Address? Address { get; set; }
}