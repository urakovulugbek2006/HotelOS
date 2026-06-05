using HotelOS.Housekeeping.Core.Entities;
using HotelOS.Housekeeping.Core.Enums;
using HotelOS.Housekeeping.Core.Interfaces;
using HotelOS.Housekeeping.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HotelOS.Housekeeping.Infrastructure.Repositories;

public class CleanlinessLogRepository : ICleanlinessLogRepository
{
    private readonly HousekeepingDbContext _db;

    public CleanlinessLogRepository(HousekeepingDbContext db) => _db = db;

    public async Task<CleanlinessLog?> GetByIdAsync(Guid id)
        => await _db.CleanlinessLogs.FirstOrDefaultAsync(l => l.Id == id);

    public async Task<IEnumerable<CleanlinessLog>> GetByRoomIdAsync(Guid roomId)
        => await _db.CleanlinessLogs
            .Where(l => l.RoomId == roomId)
            .OrderByDescending(l => l.StartedAt)
            .ToListAsync();

    public async Task<IEnumerable<CleanlinessLog>> GetActiveAsync()
        => await _db.CleanlinessLogs
            .Where(l => l.Status == CleanStatus.BeingCleaned)
            .ToListAsync();

    public async Task AddAsync(CleanlinessLog log)
    {
        await _db.CleanlinessLogs.AddAsync(log);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(CleanlinessLog log)
    {
        _db.CleanlinessLogs.Update(log);
        await _db.SaveChangesAsync();
    }
}