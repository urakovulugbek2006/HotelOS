using HotelOS.Reception.Core.Entities;
using HotelOS.Reception.Core.Enums;
using HotelOS.Reception.Core.Interfaces;

namespace HotelOS.Reception.Core.Services;

public class ReceptionService : IReceptionService
{
    private readonly IRoomRepository    _roomRepo;
    private readonly IBookingRepository _bookingRepo;

    public ReceptionService(
        IRoomRepository    roomRepo,
        IBookingRepository bookingRepo)
    {
        _roomRepo    = roomRepo;
        _bookingRepo = bookingRepo;
    }

    // ── Room operations ────────────────────────────────────────

    public async Task<IEnumerable<Room>> GetAllRoomsAsync(RoomStatus? status)
    {
        var rooms = await _roomRepo.GetAllAsync();
        return status.HasValue ? rooms.Where(r => r.Status == status.Value) : rooms;
    }

    public async Task<IEnumerable<Room>> SearchAvailableRoomsAsync(
        RoomStyle? style, DateTime checkIn, DateTime checkOut)
    {
        if (checkIn >= checkOut)
            throw new ArgumentException("CheckOut must be after CheckIn.");
        if (checkIn < DateTime.UtcNow.AddMinutes(-5))
            throw new ArgumentException("CheckIn cannot be in the past.");

        return await _roomRepo.SearchAvailableAsync(style, checkIn, checkOut);
    }

    public async Task<Room> CreateRoomAsync(Room room)
    {
        room.Id           = Guid.NewGuid();
        room.BufferConfig = new RoomBufferConfig
        {
            Id     = Guid.NewGuid(),
            RoomId = room.Id
        };
        await _roomRepo.AddAsync(room);
        return room;
    }

    public async Task UpdateRoomBufferAsync(Guid roomId,
        int cleaningBufferMins, int maintenanceBufferMins,
        BufferType bufferType, string updatedBy)
    {
        var room = await _roomRepo.GetByIdWithBookingsAsync(roomId)
            ?? throw new KeyNotFoundException($"Room {roomId} not found.");

        room.BufferConfig.CleaningBufferMins    = cleaningBufferMins;
        room.BufferConfig.MaintenanceBufferMins = maintenanceBufferMins;
        room.BufferConfig.BufferType            = bufferType;
        room.BufferConfig.UpdatedAt             = DateTime.UtcNow;
        room.BufferConfig.UpdatedBy             = updatedBy;

        await _roomRepo.UpdateAsync(room);
    }

    public async Task UpdateRoomStatusAsync(Guid roomId, RoomStatus status)
    {
        var room = await _roomRepo.GetByIdAsync(roomId)
            ?? throw new KeyNotFoundException($"Room {roomId} not found.");
        room.UpdateStatus(status);
        await _roomRepo.UpdateAsync(room);
    }

    public async Task RestoreRoomAsync(Guid roomId)
    {
        var room = await _roomRepo.GetByIdAsync(roomId)
            ?? throw new KeyNotFoundException($"Room {roomId} not found.");
        if (room.Status != RoomStatus.Archived)
            throw new InvalidOperationException("Only archived rooms can be restored.");
        room.UpdateStatus(RoomStatus.Available);
        await _roomRepo.UpdateAsync(room);
    }

    public async Task<Room?> GetRoomAsync(Guid roomId)
        => await _roomRepo.GetByIdWithBookingsAsync(roomId);

    // ── Booking operations ─────────────────────────────────────

    public async Task<IEnumerable<Booking>> GetAllBookingsAsync(BookingStatus? status)
        => await _bookingRepo.GetAllAsync(status);

    public async Task<IEnumerable<Booking>> GetBookingsByGuestIdAsync(Guid guestId)
        => await _bookingRepo.GetByGuestIdAsync(guestId);

    public async Task<Booking?> GetBookingAsync(Guid bookingId)
        => await _bookingRepo.GetByIdAsync(bookingId);

    public async Task<Booking> CreateReservationAsync(
        Guid guestId, Guid roomId,
        DateTime checkIn, DateTime checkOut)
    {
        if (checkIn >= checkOut)
            throw new ArgumentException("CheckOut must be after CheckIn.");

        var checkInUtc  = DateTime.SpecifyKind(checkIn,  DateTimeKind.Utc);
        var checkOutUtc = DateTime.SpecifyKind(checkOut, DateTimeKind.Utc);

        // Transactional: re-checks availability under a DB-level lock,
        // sets room.Status = Reserved, and creates booking atomically.
        return await _bookingRepo.CreateReservedAsync(
            guestId, roomId, checkInUtc, checkOutUtc);
    }

    public async Task<Booking> ConfirmReservationAsync(Guid bookingId)
    {
        var booking = await _bookingRepo.GetByIdAsync(bookingId)
            ?? throw new KeyNotFoundException("Booking not found.");

        if (booking.Status != BookingStatus.PendingPayment)
            throw new InvalidOperationException(
                $"Cannot confirm booking in status {booking.Status}.");

        if (DateTime.UtcNow > booking.ExpiresAt)
            throw new InvalidOperationException(
                "Booking has expired. Payment window exceeded.");

        booking.Status = BookingStatus.Confirmed;
        await _bookingRepo.UpdateAsync(booking);
        return booking;
    }

    public async Task<Booking> CancelReservationAsync(Guid bookingId)
    {
        var booking = await _bookingRepo.GetByIdAsync(bookingId)
            ?? throw new KeyNotFoundException("Booking not found.");

        if (booking.Status is BookingStatus.Cancelled or BookingStatus.Completed)
            throw new InvalidOperationException(
                $"Cannot cancel booking in status {booking.Status}.");

        var hoursUntilCheckIn = (booking.CheckIn - DateTime.UtcNow).TotalHours;
        booking.PenaltyType = hoursUntilCheckIn switch
        {
            > 48 => CancellationPenalty.FullRefund,
            > 24 => CancellationPenalty.StandardPenalty,
            _    => CancellationPenalty.NoRefund
        };

        booking.Status = BookingStatus.Cancelled;
        await _bookingRepo.UpdateAsync(booking);

        // Release the room if it was waiting for check-in (Reserved)
        if (booking.Room?.Status == RoomStatus.Reserved)
            await UpdateRoomStatusAsync(booking.RoomId, RoomStatus.Available);

        return booking;
    }

    public async Task<Booking> CheckInAsync(Guid bookingId)
    {
        var booking = await _bookingRepo.GetByIdAsync(bookingId)
            ?? throw new KeyNotFoundException("Booking not found.");

        if (booking.Status != BookingStatus.Confirmed)
            throw new InvalidOperationException(
                "Only confirmed bookings can be checked in.");

        booking.Status = BookingStatus.Active;
        await _bookingRepo.UpdateAsync(booking);

        await UpdateRoomStatusAsync(booking.RoomId, RoomStatus.Active);
        return booking;
    }

    public async Task<Booking> CheckOutAsync(Guid bookingId)
    {
        var booking = await _bookingRepo.GetByIdAsync(bookingId)
            ?? throw new KeyNotFoundException("Booking not found.");

        if (booking.Status != BookingStatus.Active)
            throw new InvalidOperationException(
                "Only active bookings can be checked out.");

        booking.Status = BookingStatus.Completed;
        await _bookingRepo.UpdateAsync(booking);

        await UpdateRoomStatusAsync(booking.RoomId, RoomStatus.Cleaning);
        return booking;
    }

    public async Task<Booking> WalkInReservationAsync(
        Guid guestId, Guid roomId,
        DateTime checkIn, DateTime checkOut)
    {
        // Same race-condition-safe path as a guest reservation:
        // room → Reserved, booking → PendingPayment, 10-min expiry window.
        // Receptionist confirms payment (or it expires and room releases).
        return await CreateReservationAsync(guestId, roomId, checkIn, checkOut);
    }

    public async Task<bool> ReassignRoomAsync(Guid bookingId, Guid newRoomId)
    {
        var booking = await _bookingRepo.GetByIdAsync(bookingId)
            ?? throw new KeyNotFoundException("Booking not found.");

        var newRoom = await _roomRepo.GetByIdWithBookingsAsync(newRoomId)
            ?? throw new KeyNotFoundException("New room not found.");

        if (!newRoom.IsAvailable(booking.CheckIn, booking.CheckOut))
            throw new InvalidOperationException(
                "New room is not available for the booking dates.");

        booking.RoomId            = newRoomId;
        booking.EffectiveCheckout = newRoom.BufferConfig
            .GetEarliestNextCheckIn(booking.CheckOut, false);

        await _bookingRepo.UpdateAsync(booking);
        return true;
    }

    public async Task ProcessExpiredReservationsAsync()
    {
        var expired = await _bookingRepo.GetExpiredPendingAsync();
        foreach (var booking in expired)
        {
            booking.Status = BookingStatus.TimedOut;
            await _bookingRepo.UpdateAsync(booking);

            // Release the Reserved room back to Available
            await UpdateRoomStatusAsync(booking.RoomId, RoomStatus.Available);
        }
    }
}
