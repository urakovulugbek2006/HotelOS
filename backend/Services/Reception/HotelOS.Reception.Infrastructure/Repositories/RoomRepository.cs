using HotelOS.Reception.Core.Entities;
using HotelOS.Reception.Core.Enums;
using HotelOS.Reception.Core.Interfaces;
using HotelOS.Reception.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HotelOS.Reception.Infrastructure.Repositories;

public class RoomRepository : IRoomRepository
{
    private readonly ReceptionDbContext _db;

    public RoomRepository(ReceptionDbContext db) => _db = db;

    public async Task<Room?> GetByIdAsync(Guid id)
        => await _db.Rooms.FirstOrDefaultAsync(r => r.Id == id);

    public async Task<Room?> GetByIdWithBookingsAsync(Guid id)
        => await _db.Rooms
                    .Include(r => r.Bookings)
                    .Include(r => r.BufferConfig)
                    .Include(r => r.Keys)
                    .FirstOrDefaultAsync(r => r.Id == id);

    public async Task<IEnumerable<Room>> GetAllAsync()
        => await _db.Rooms
                    .Include(r => r.Bookings)
                    .Include(r => r.BufferConfig)
                    .ToListAsync();

    public async Task<IEnumerable<Room>> SearchAvailableAsync(
        RoomStyle? style, DateTime checkIn, DateTime checkOut)
    {
        // load all non-archived, non-OOS rooms with their bookings
        var query = _db.Rooms
            .Include(r => r.Bookings)
            .Include(r => r.BufferConfig)
            .Where(r => r.Status != RoomStatus.Reserved
                     && r.Status != RoomStatus.Active
                     && r.Status != RoomStatus.OOS
                     && r.Status != RoomStatus.Archived);

        if (style.HasValue)
            query = query.Where(r => r.Style == style.Value);

        var rooms = await query.ToListAsync();

        // apply the in-memory availability algorithm
        // (EF can't translate the buffer logic to SQL)
        return rooms.Where(r => r.IsAvailable(checkIn, checkOut));
    }

    public async Task AddAsync(Room room)
    {
        await _db.Rooms.AddAsync(room);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(Room room)
    {
        _db.Rooms.Update(room);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var room = await GetByIdAsync(id);
        if (room is not null)
        {
            room.Status = RoomStatus.Archived; // soft delete
            await _db.SaveChangesAsync();
        }
    }
}