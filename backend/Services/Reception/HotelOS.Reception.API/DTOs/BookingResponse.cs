namespace HotelOS.Reception.API.DTOs;

public record BookingResponse(
    Guid     Id,
    Guid     GuestId,
    Guid     RoomId,
    string   RoomNumber,
    DateTime CheckIn,
    DateTime CheckOut,
    DateTime EffectiveCheckout,
    string   Status,
    double   TotalPrice,
    DateTime ExpiresAt,
    DateTime CreatedAt);