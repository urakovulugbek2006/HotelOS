namespace HotelOS.Maintenance.Core.Entities;

public class MaintenanceTicket
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public Guid ReportedBy { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = "Normal";
    public string Status { get; set; } = "Open";
    public int EstimatedMins { get; set; } = 240;
    public Guid? AssignedStaffId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }

    public void Assign(Guid staffId)
    {
        AssignedStaffId = staffId;
        Status          = "InProgress";
    }

    public bool Resolve()
    {
        Status     = "Resolved";
        ResolvedAt = DateTime.UtcNow;
        return true;
    }

    public int GetEstimatedDuration() => EstimatedMins;
}