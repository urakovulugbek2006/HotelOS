using HotelOS.Reception.Core.Enums;

namespace HotelOS.Reception.API.DTOs;

public record CreateRoomRequest(
    string    RoomNumber,
    int       Floor,
    RoomStyle Style,
    double    PricePerNight,
    int       Capacity,
    bool      IsSmokingAllowed,
    string    Description);

public record RoomResponse(
    Guid      Id,
    string    RoomNumber,
    int       Floor,
    string    Style,
    string    Status,
    double    PricePerNight,
    int       Capacity,
    bool      IsSmokingAllowed,
    string    Description,
    DateTime  NextAvailableFrom);

public record UpdateBufferRequest(
    int    CleaningBufferMins,
    int    MaintenanceBufferMins,
    string BufferType);

public record BufferResponse(
    Guid     RoomId,
    int      CleaningBufferMins,
    int      MaintenanceBufferMins,
    string   BufferType,
    DateTime UpdatedAt);