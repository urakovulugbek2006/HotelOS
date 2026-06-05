namespace HotelOS.Identity.API.DTOs;

public record StaffProfileDto(
    string FirstName,
    string LastName,
    string Phone,
    string Department,
    string JobTitle,
    DateTime HireDate,
    string EmergencyContactName,
    string EmergencyContactPhone);