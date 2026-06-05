using HotelOS.Housekeeping.Core.Entities;
using HotelOS.Housekeeping.Core.Enums;
using HotelOS.Housekeeping.Core.Interfaces;

namespace HotelOS.Housekeeping.Core.Services;

public class HousekeepingService : IHousekeepingService
{
    private readonly ICleanlinessLogRepository _repo;

    public HousekeepingService(ICleanlinessLogRepository repo)
        => _repo = repo;

    public async Task<CleanlinessLog> AssignCleaningAsync(Guid roomId, Guid staffId)
    {
        var log = new CleanlinessLog
        {
            Id       = Guid.NewGuid(),
            RoomId   = roomId,
            StaffId  = staffId,
            Status   = CleanStatus.BeingCleaned,
            StartedAt= DateTime.UtcNow
        };

        await _repo.AddAsync(log);
        return log;
    }

    public async Task<CleanlinessLog> StartCleaningAsync(Guid logId)
    {
        var log = await _repo.GetByIdAsync(logId)
                  ?? throw new KeyNotFoundException("Cleaning log not found.");

        log.Start();
        await _repo.UpdateAsync(log);
        return log;
    }

    public async Task<CleanlinessLog> MarkCleanAsync(Guid logId)
    {
        var log = await _repo.GetByIdAsync(logId)
                  ?? throw new KeyNotFoundException("Cleaning log not found.");

        if (log.Status == CleanStatus.Completed)
            throw new InvalidOperationException("Cleaning already completed.");

        log.Complete();
        await _repo.UpdateAsync(log);
        return log;
    }

    public async Task<IEnumerable<CleanlinessLog>> GetActiveLogsAsync()
        => await _repo.GetActiveAsync();

    public async Task<IEnumerable<CleanlinessLog>> GetByRoomAsync(Guid roomId)
        => await _repo.GetByRoomIdAsync(roomId);
}