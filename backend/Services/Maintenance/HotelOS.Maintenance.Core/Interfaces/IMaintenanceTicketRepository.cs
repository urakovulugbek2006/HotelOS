using HotelOS.Maintenance.Core.Entities;

namespace HotelOS.Maintenance.Core.Interfaces;

public interface IMaintenanceTicketRepository
{
    Task<MaintenanceTicket?> GetByIdAsync(Guid id);
    Task<IEnumerable<MaintenanceTicket>> GetByRoomIdAsync(Guid roomId);
    Task<IEnumerable<MaintenanceTicket>> GetActiveAsync();
    Task AddAsync(MaintenanceTicket ticket);
    Task UpdateAsync(MaintenanceTicket ticket);
}