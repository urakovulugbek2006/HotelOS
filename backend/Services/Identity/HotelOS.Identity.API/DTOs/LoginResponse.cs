namespace HotelOS.Identity.API.DTOs;

public record LoginResponse(
    Guid   Id,
    string Email,
    string Role,
    string Token,
    DateTime ExpiresAt);