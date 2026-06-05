using HotelOS.Reception.Core.Enums;

namespace HotelOS.Reception.Core.Entities;

public class RoomBufferConfig
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public int CleaningBufferMins { get; set; } = 120;   // 2 hours default
    public int MaintenanceBufferMins { get; set; } = 240; // 4 hours default
    public BufferType BufferType { get; set; } = BufferType.CleaningOnly;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string UpdatedBy { get; set; } = string.Empty; // Manager id

    public int GetTotalBuffer(bool hasActiveTicket)
        => CleaningBufferMins + (hasActiveTicket ? MaintenanceBufferMins : 0);

    public DateTime GetEarliestNextCheckIn(DateTime checkOut, bool hasActiveTicket)
        => checkOut.AddMinutes(GetTotalBuffer(hasActiveTicket));
}