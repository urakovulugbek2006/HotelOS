namespace HotelOS.Reception.API.DTOs;

public record CreateBookingRequest(
    Guid     RoomId,
    DateTime CheckIn,
    DateTime CheckOut);

public record WalkInBookingRequest(
    Guid     GuestId,
    Guid     RoomId,
    DateTime CheckIn,
    DateTime CheckOut);

public record ReassignRoomRequest(Guid NewRoomId);

public record UpdateRoomStatusRequest(string Status);