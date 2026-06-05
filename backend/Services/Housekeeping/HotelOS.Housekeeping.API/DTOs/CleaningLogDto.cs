namespace HotelOS.Housekeeping.API.DTOs;

public record AssignCleaningRequest(Guid RoomId, Guid StaffId);

public record CleaningLogResponse(
    Guid     Id,
    Guid     RoomId,
    Guid     StaffId,
    string   Status,
    DateTime StartedAt,
    DateTime? CompletedAt,
    int      DurationMins,
    string   Notes);