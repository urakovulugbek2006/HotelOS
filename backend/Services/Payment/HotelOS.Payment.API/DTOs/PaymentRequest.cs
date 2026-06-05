namespace HotelOS.Payment.API.DTOs;

public record InitiatePaymentRequest(
    Guid   BookingId,
    double Amount,
    string Currency = "USD");

public record ConfirmPaymentRequest(string StripePaymentIntentId);