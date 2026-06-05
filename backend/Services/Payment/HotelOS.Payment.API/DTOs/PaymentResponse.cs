namespace HotelOS.Payment.API.DTOs;

public record PaymentResponse(
    Guid    Id,
    Guid    BookingId,
    double  Amount,
    string  Currency,
    string  Status,
    string? ClientSecret,
    string? GatewayRef,
    DateTime CreatedAt);