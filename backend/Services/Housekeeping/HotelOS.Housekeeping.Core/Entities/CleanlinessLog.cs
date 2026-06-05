using HotelOS.Housekeeping.Core.Enums;

namespace HotelOS.Housekeeping.Core.Entities;

public class CleanlinessLog
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public Guid StaffId { get; set; }
    public CleanStatus Status { get; set; } = CleanStatus.BeingCleaned;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public int DurationMins { get; set; }
    public string Notes { get; set; } = string.Empty;

    public void Start()
    {
        Status    = CleanStatus.BeingCleaned;
        StartedAt = DateTime.UtcNow;
    }

    public void Complete()
    {
        Status       = CleanStatus.Completed;
        CompletedAt  = DateTime.UtcNow;
        DurationMins = (int)(CompletedAt.Value - StartedAt).TotalMinutes;
    }

    public int GetDuration()
        => CompletedAt.HasValue
            ? (int)(CompletedAt.Value - StartedAt).TotalMinutes
            : (int)(DateTime.UtcNow - StartedAt).TotalMinutes;
}