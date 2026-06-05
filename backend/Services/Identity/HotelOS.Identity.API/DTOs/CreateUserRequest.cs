using HotelOS.Identity.Core.Enums;

namespace HotelOS.Identity.API.DTOs;

public record CreateClientRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string Phone);

public record CreateStaffRequest(
    string    Email,
    string    Password,
    AccType   Role,
    StaffProfileDto Profile);