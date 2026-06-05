namespace HotelOS.Notification.Core.Interfaces;

public interface INotificationService
{
    Task PushRoomStatusUpdatedAsync(Guid roomId, string roomNumber, string newStatus);
    Task PushReservationCreatedAsync(Guid bookingId, Guid guestId, DateTime expiresAt);
    Task PushReservationExpiredAsync(Guid bookingId, Guid guestId);
    Task PushPaymentConfirmedAsync(Guid bookingId, Guid guestId);
    Task PushOrderCreatedAsync(Guid orderId, Guid roomId, string roomNumber);
    Task PushOrderUpdatedAsync(Guid orderId, string newStatus);
}