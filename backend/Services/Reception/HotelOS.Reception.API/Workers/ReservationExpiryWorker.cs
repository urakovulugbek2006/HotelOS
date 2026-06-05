using HotelOS.Reception.Core.Interfaces;
using HotelOS.Shared.Contracts.Events;
using MassTransit;

namespace HotelOS.Reception.API.Workers;

public class ReservationExpiryWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IBus _bus;
    private readonly ILogger<ReservationExpiryWorker> _logger;

    public ReservationExpiryWorker(
        IServiceScopeFactory scopeFactory,
        IBus bus,
        ILogger<ReservationExpiryWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _bus          = bus;
        _logger       = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

            try
            {
                await using var scope = _scopeFactory.CreateAsyncScope();
                var bookingRepo = scope.ServiceProvider.GetRequiredService<IBookingRepository>();
                var service     = scope.ServiceProvider.GetRequiredService<IReceptionService>();

                var expired = (await bookingRepo.GetExpiredPendingAsync()).ToList();
                if (expired.Count == 0) continue;

                await service.ProcessExpiredReservationsAsync();

                foreach (var booking in expired)
                {
                    try
                    {
                        await _bus.Publish(new ReservationExpiredEvent(
                            booking.Id, booking.RoomId, booking.GuestId,
                            DateTime.UtcNow), stoppingToken);

                        _logger.LogInformation(
                            "Published ReservationExpiredEvent for booking {BookingId}", booking.Id);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex,
                            "Failed to publish ReservationExpiredEvent for booking {BookingId}", booking.Id);
                    }
                }

                _logger.LogInformation("Expired {Count} reservation(s)", expired.Count);
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogError(ex, "Error processing expired reservations");
            }
        }
    }
}
