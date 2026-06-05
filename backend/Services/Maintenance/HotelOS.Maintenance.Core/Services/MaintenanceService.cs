using HotelOS.Maintenance.Core.Entities;
using HotelOS.Maintenance.Core.Interfaces;

namespace HotelOS.Maintenance.Core.Services;

public class MaintenanceService : IMaintenanceService
{
    private readonly IMaintenanceTicketRepository _repo;

    public MaintenanceService(IMaintenanceTicketRepository repo)
        => _repo = repo;

    public async Task<MaintenanceTicket> CreateTicketAsync(
        Guid roomId, Guid reportedBy,
        string description, string priority, int estimatedMins)
    {
        var ticket = new MaintenanceTicket
        {
            Id            = Guid.NewGuid(),
            RoomId        = roomId,
            ReportedBy    = reportedBy,
            Description   = description,
            Priority      = priority,
            EstimatedMins = estimatedMins,
            Status        = "Open",
            CreatedAt     = DateTime.UtcNow
        };

        await _repo.AddAsync(ticket);
        return ticket;
    }

    public async Task<MaintenanceTicket> AssignStaffAsync(Guid ticketId, Guid staffId)
    {
        var ticket = await _repo.GetByIdAsync(ticketId)
            ?? throw new KeyNotFoundException("Ticket not found.");

        ticket.Assign(staffId);
        await _repo.UpdateAsync(ticket);
        return ticket;
    }

    public async Task<MaintenanceTicket> ResolveTicketAsync(Guid ticketId)
    {
        var ticket = await _repo.GetByIdAsync(ticketId)
            ?? throw new KeyNotFoundException("Ticket not found.");

        if (ticket.Status == "Resolved")
            throw new InvalidOperationException("Ticket already resolved.");

        ticket.Resolve();
        await _repo.UpdateAsync(ticket);
        return ticket;
    }

    public async Task<IEnumerable<MaintenanceTicket>> GetActiveTicketsAsync()
        => await _repo.GetActiveAsync();

    public async Task<IEnumerable<MaintenanceTicket>> GetByRoomAsync(Guid roomId)
        => await _repo.GetByRoomIdAsync(roomId);

    public async Task<MaintenanceTicket?> GetByIdAsync(Guid id)
        => await _repo.GetByIdAsync(id);
}