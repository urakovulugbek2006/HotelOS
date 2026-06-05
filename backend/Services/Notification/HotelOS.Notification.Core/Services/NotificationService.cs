using HotelOS.Notification.Core.Interfaces;

namespace HotelOS.Notification.Core.Services;

/// <summary>
/// Placeholder — actual pushing happens in the API layer
/// via IHubContext. This interface keeps Core clean.
/// </summary>
public class NotificationService : INotificationService
{
    public Task PushRoomStatusUpdatedAsync(
        Guid roomId, string roomNumber, string newStatus)
        => Task.CompletedTask;

    public Task PushReservationCreatedAsync(
        Guid bookingId, Guid guestId, DateTime expiresAt)
        => Task.CompletedTask;

    public Task PushReservationExpiredAsync(Guid bookingId, Guid guestId)
        => Task.CompletedTask;

    public Task PushPaymentConfirmedAsync(Guid bookingId, Guid guestId)
        => Task.CompletedTask;

    public Task PushOrderCreatedAsync(
        Guid orderId, Guid roomId, string roomNumber)
        => Task.CompletedTask;

    public Task PushOrderUpdatedAsync(Guid orderId, string newStatus)
        => Task.CompletedTask;
}