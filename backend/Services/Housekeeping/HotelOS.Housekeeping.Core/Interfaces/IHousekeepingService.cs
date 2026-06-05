using HotelOS.Housekeeping.Core.Entities;

namespace HotelOS.Housekeeping.Core.Interfaces;

public interface IHousekeepingService
{
    Task<CleanlinessLog> AssignCleaningAsync(Guid roomId, Guid staffId);
    Task<CleanlinessLog> StartCleaningAsync(Guid logId);
    Task<CleanlinessLog> MarkCleanAsync(Guid logId);
    Task<IEnumerable<CleanlinessLog>> GetActiveLogsAsync();
    Task<IEnumerable<CleanlinessLog>> GetByRoomAsync(Guid roomId);
}