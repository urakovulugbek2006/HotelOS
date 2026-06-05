using HotelOS.Reception.Core.Entities;
using HotelOS.Reception.Core.Enums;

namespace HotelOS.Reception.Core.Interfaces;

public interface IReceptionService
{
    // Room operations
    Task<IEnumerable<Room>> GetAllRoomsAsync(RoomStatus? status);
    Task<IEnumerable<Room>> SearchAvailableRoomsAsync(
        RoomStyle? style, DateTime checkIn, DateTime checkOut);
    Task<Room> CreateRoomAsync(Room room);
    Task UpdateRoomStatusAsync(Guid roomId, RoomStatus status);
    Task RestoreRoomAsync(Guid roomId);
    Task UpdateRoomBufferAsync(Guid roomId, int cleaningBufferMins,
        int maintenanceBufferMins, BufferType bufferType, string updatedBy);
    Task<Room?> GetRoomAsync(Guid roomId);

    // Booking operations
    Task<IEnumerable<Booking>> GetAllBookingsAsync(BookingStatus? status);
    Task<IEnumerable<Booking>> GetBookingsByGuestIdAsync(Guid guestId);
    Task<Booking?> GetBookingAsync(Guid bookingId);
    Task<Booking> CreateReservationAsync(
        Guid guestId, Guid roomId, DateTime checkIn, DateTime checkOut);
    Task<Booking> ConfirmReservationAsync(Guid bookingId);
    Task<Booking> CancelReservationAsync(Guid bookingId);
    Task<Booking> CheckInAsync(Guid bookingId);
    Task<Booking> CheckOutAsync(Guid bookingId);
    Task<Booking> WalkInReservationAsync(
        Guid guestId, Guid roomId, DateTime checkIn, DateTime checkOut);
    Task<bool> ReassignRoomAsync(Guid bookingId, Guid newRoomId);
    Task ProcessExpiredReservationsAsync();
}