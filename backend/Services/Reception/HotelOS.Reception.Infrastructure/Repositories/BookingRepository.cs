using HotelOS.Reception.Core.Entities;
using HotelOS.Reception.Core.Enums;
using HotelOS.Reception.Core.Interfaces;
using HotelOS.Reception.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace HotelOS.Reception.Infrastructure.Repositories;

public class BookingRepository : IBookingRepository
{
    private readonly ReceptionDbContext _db;

    public BookingRepository(ReceptionDbContext db) => _db = db;

    public async Task<Booking?> GetByIdAsync(Guid id)
        => await _db.Bookings
            .Include(b => b.Room)
            .FirstOrDefaultAsync(b => b.Id == id);

    public async Task<IEnumerable<Booking>> GetByGuestIdAsync(Guid guestId)
        => await _db.Bookings
            .Include(b => b.Room)
            .Where(b => b.GuestId == guestId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

    public async Task<IEnumerable<Booking>> GetByRoomIdAsync(Guid roomId)
        => await _db.Bookings
            .Where(b => b.RoomId == roomId)
            .OrderByDescending(b => b.CheckIn)
            .ToListAsync();

    public async Task<IEnumerable<Booking>> GetAllAsync(BookingStatus? status)
    {
        var query = _db.Bookings.Include(b => b.Room).AsQueryable();
        if (status.HasValue)
            query = query.Where(b => b.Status == status.Value);
        return await query.OrderByDescending(b => b.CreatedAt).ToListAsync();
    }

    public async Task<IEnumerable<Booking>> GetExpiredPendingAsync()
        => await _db.Bookings
            .Where(b => b.Status == BookingStatus.PendingPayment
                        && b.ExpiresAt < DateTime.UtcNow)
            .ToListAsync();

    public async Task AddAsync(Booking booking)
    {
        await _db.Bookings.AddAsync(booking);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(Booking booking)
    {
        _db.Bookings.Update(booking);
        await _db.SaveChangesAsync();
    }

    public async Task<Booking> CreateReservedAsync(
        Guid guestId, Guid roomId, DateTime checkIn, DateTime checkOut)
    {
        var strategy = _db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                var room = await _db.Rooms
                               .Include(r => r.Bookings)
                               .Include(r => r.BufferConfig)
                               .FirstOrDefaultAsync(r => r.Id == roomId)
                           ?? throw new KeyNotFoundException($"Room {roomId} not found.");

                if (!room.IsAvailable(checkIn, checkOut))
                    throw new InvalidOperationException(
                        "Room is not available for the requested dates.");

                // Atomic status transition. Mirrors IsAvailable()'s blocked-status list exactly:
                // any room that isn't Reserved/Active/OOS/Archived can be reserved.
                // Only one concurrent request will get rowsAffected = 1; the other throws.
                var rowsAffected = await _db.Rooms
                    .Where(r => r.Id == roomId
                             && r.Status != RoomStatus.Reserved
                             && r.Status != RoomStatus.Active
                             && r.Status != RoomStatus.OOS
                             && r.Status != RoomStatus.Archived)
                    .ExecuteUpdateAsync(s => s.SetProperty(r => r.Status, RoomStatus.Reserved));

                if (rowsAffected == 0)
                    throw new InvalidOperationException(
                        "Room is not available — it was just reserved by someone else.");

                var nights = (checkOut - checkIn).TotalDays;
                var effectiveCheckout = room.BufferConfig
                    .GetEarliestNextCheckIn(checkOut, false);

                var booking = new Booking
                {
                    Id = Guid.NewGuid(),
                    GuestId = guestId,
                    RoomId = roomId,
                    CheckIn = checkIn,
                    CheckOut = checkOut,
                    EffectiveCheckout = effectiveCheckout,
                    Status = BookingStatus.PendingPayment,
                    TotalPrice = nights * room.PricePerNight,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(10),
                };

                await _db.Bookings.AddAsync(booking);
                await _db.SaveChangesAsync();
                await tx.CommitAsync();
                return booking;
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        });
    }
}