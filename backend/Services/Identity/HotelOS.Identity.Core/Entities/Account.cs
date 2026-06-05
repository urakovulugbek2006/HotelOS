using HotelOS.Identity.Core.Enums;

namespace HotelOS.Identity.Core.Entities;

public abstract class Account
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public AccStatus Status { get; set; } = AccStatus.Active;
    public AccType Role { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
}