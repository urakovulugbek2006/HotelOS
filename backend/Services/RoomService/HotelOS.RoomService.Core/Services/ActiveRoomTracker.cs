using HotelOS.RoomService.Core.Interfaces;

namespace HotelOS.RoomService.Core.Services;

public class ActiveRoomTracker : IActiveRoomTracker
{
    private readonly HashSet<Guid> _activeRooms = new();
    private readonly object _lock = new();

    public bool IsRoomActive(Guid roomId)
    {
        lock (_lock) return _activeRooms.Contains(roomId);
    }

    public void UpdateRoomStatus(Guid roomId, string status)
    {
        lock (_lock)
        {
            if (status == "Active")
                _activeRooms.Add(roomId);
            else
                _activeRooms.Remove(roomId);
        }
    }
}
