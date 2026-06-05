namespace HotelOS.Identity.API.DTOs;

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
