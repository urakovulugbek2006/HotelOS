using HotelOS.Housekeeping.Core.Entities;

namespace HotelOS.Housekeeping.Core.Interfaces;

public interface ICleanlinessLogRepository
{
    Task<CleanlinessLog?> GetByIdAsync(Guid id);
    Task<IEnumerable<CleanlinessLog>> GetByRoomIdAsync(Guid roomId);
    Task<IEnumerable<CleanlinessLog>> GetActiveAsync();
    Task AddAsync(CleanlinessLog log);
    Task UpdateAsync(CleanlinessLog log);
}