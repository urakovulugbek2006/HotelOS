using HotelOS.Reception.Core.Entities;
using HotelOS.Reception.Core.Enums;

namespace HotelOS.Reception.Core.Interfaces;

public interface IRoomRepository
{
    Task<Room?> GetByIdAsync(Guid id);
    Task<Room?> GetByIdWithBookingsAsync(Guid id);
    Task<IEnumerable<Room>> GetAllAsync();
    Task<IEnumerable<Room>> SearchAvailableAsync(
        RoomStyle? style, DateTime checkIn, DateTime checkOut);
    Task AddAsync(Room room);
    Task UpdateAsync(Room room);
    Task DeleteAsync(Guid id);
}