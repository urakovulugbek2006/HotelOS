using HotelOS.Maintenance.Core.Entities;
using HotelOS.Maintenance.Core.Interfaces;
using HotelOS.Maintenance.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HotelOS.Maintenance.Infrastructure.Repositories;

public class MaintenanceTicketRepository : IMaintenanceTicketRepository
{
    private readonly MaintenanceDbContext _db;

    public MaintenanceTicketRepository(MaintenanceDbContext db) => _db = db;

    public async Task<MaintenanceTicket?> GetByIdAsync(Guid id)
        => await _db.Tickets.FirstOrDefaultAsync(t => t.Id == id);

    public async Task<IEnumerable<MaintenanceTicket>> GetByRoomIdAsync(Guid roomId)
        => await _db.Tickets
            .Where(t => t.RoomId == roomId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

    public async Task<IEnumerable<MaintenanceTicket>> GetActiveAsync()
        => await _db.Tickets
            .Where(t => t.Status != "Resolved")
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

    public async Task AddAsync(MaintenanceTicket ticket)
    {
        await _db.Tickets.AddAsync(ticket);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(MaintenanceTicket ticket)
    {
        _db.Tickets.Update(ticket);
        await _db.SaveChangesAsync();
    }
}