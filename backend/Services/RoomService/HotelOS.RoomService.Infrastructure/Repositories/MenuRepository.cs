using HotelOS.RoomService.Core.Entities;
using HotelOS.RoomService.Core.Interfaces;
using HotelOS.RoomService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HotelOS.RoomService.Infrastructure.Repositories;

public class MenuItemRepository : IMenuItemRepository
{
    private readonly RoomServiceDbContext _db;

    public MenuItemRepository(RoomServiceDbContext db) => _db = db;

    public async Task<MenuItem?> GetByIdAsync(Guid id)
        => await _db.MenuItems.FirstOrDefaultAsync(m => m.Id == id);

    public async Task<IEnumerable<MenuItem>> GetAllAsync()
        => await _db.MenuItems.ToListAsync();

    public async Task<IEnumerable<MenuItem>> GetAvailableAsync()
        => await _db.MenuItems.Where(m => m.IsAvailable).ToListAsync();

    public async Task AddAsync(MenuItem item)
    {
        await _db.MenuItems.AddAsync(item);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(MenuItem item)
    {
        _db.MenuItems.Update(item);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var item = await GetByIdAsync(id);
        if (item is not null)
        {
            _db.MenuItems.Remove(item);
            await _db.SaveChangesAsync();
        }
    }
}