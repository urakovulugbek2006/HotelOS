using HotelOS.RoomService.Core.Entities;

namespace HotelOS.RoomService.Core.Interfaces;

public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(Guid id);
    Task<IEnumerable<Order>> GetByBookingIdAsync(Guid bookingId);
    Task<IEnumerable<Order>> GetActiveAsync();
    Task AddAsync(Order order);
    Task UpdateAsync(Order order);
}