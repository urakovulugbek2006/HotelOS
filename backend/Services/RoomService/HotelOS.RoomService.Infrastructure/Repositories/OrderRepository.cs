using HotelOS.RoomService.Core.Entities;
using HotelOS.RoomService.Core.Enums;
using HotelOS.RoomService.Core.Interfaces;
using HotelOS.RoomService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HotelOS.RoomService.Infrastructure.Repositories;

public class OrderRepository : IOrderRepository
{
    private readonly RoomServiceDbContext _db;

    public OrderRepository(RoomServiceDbContext db) => _db = db;

    public async Task<Order?> GetByIdAsync(Guid id)
        => await _db.Orders
            .Include(o => o.Items)
            .ThenInclude(i => i.MenuItem)
            .FirstOrDefaultAsync(o => o.Id == id);

    public async Task<IEnumerable<Order>> GetByBookingIdAsync(Guid bookingId)
        => await _db.Orders
            .Include(o => o.Items)
            .ThenInclude(i => i.MenuItem)
            .Where(o => o.BookingId == bookingId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

    public async Task<IEnumerable<Order>> GetActiveAsync()
        => await _db.Orders
            .Include(o => o.Items)
            .Where(o => o.Status != OrderStatus.Delivered)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

    public async Task AddAsync(Order order)
    {
        await _db.Orders.AddAsync(order);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(Order order)
    {
        _db.Orders.Update(order);
        await _db.SaveChangesAsync();
    }
}