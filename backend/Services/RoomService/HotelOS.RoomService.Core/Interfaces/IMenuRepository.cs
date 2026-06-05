using HotelOS.RoomService.Core.Entities;

namespace HotelOS.RoomService.Core.Interfaces;

public interface IMenuItemRepository
{
    Task<MenuItem?> GetByIdAsync(Guid id);
    Task<IEnumerable<MenuItem>> GetAllAsync();
    Task<IEnumerable<MenuItem>> GetAvailableAsync();
    Task AddAsync(MenuItem item);
    Task UpdateAsync(MenuItem item);
    Task DeleteAsync(Guid id);
}