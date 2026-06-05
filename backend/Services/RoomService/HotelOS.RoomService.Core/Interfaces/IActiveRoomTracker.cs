namespace HotelOS.RoomService.Core.Interfaces;

public interface IActiveRoomTracker
{
    bool IsRoomActive(Guid roomId);
    void UpdateRoomStatus(Guid roomId, string status);
}
