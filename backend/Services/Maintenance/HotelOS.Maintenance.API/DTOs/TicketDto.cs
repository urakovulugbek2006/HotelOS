namespace HotelOS.Maintenance.API.DTOs;

public record CreateTicketRequest(
    Guid   RoomId,
    string Description,
    string Priority      = "Normal",
    int    EstimatedMins = 240);

public record AssignStaffRequest(Guid StaffId);

public record TicketResponse(
    Guid     Id,
    Guid     RoomId,
    Guid     ReportedBy,
    string   Description,
    string   Priority,
    string   Status,
    int      EstimatedMins,
    Guid?    AssignedStaffId,
    DateTime CreatedAt,
    DateTime? ResolvedAt);