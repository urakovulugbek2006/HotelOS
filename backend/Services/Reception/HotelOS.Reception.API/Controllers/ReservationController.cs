using HotelOS.Reception.Core.Interfaces;
using HotelOS.Shared.Contracts.Events;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelOS.Reception.API.Controllers;

/// <summary>
/// Internal endpoint — called by the scheduler when the
/// 10-minute payment window fires (reservation.expired event).
/// </summary>
[ApiController]
[Route("api/reservations")]
public class ReservationController : ControllerBase
{
    private readonly IReceptionService _service;
    private readonly IPublishEndpoint  _broker;

    public ReservationController(
        IReceptionService service, IPublishEndpoint broker)
    {
        _service = service;
        _broker  = broker;
    }

    /// <summary>POST api/reservations/process-expired
    /// Scans for PendingPayment bookings past their ExpiresAt
    /// and marks them TimedOut. Called by a background job.</summary>
    [HttpPost("process-expired")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> ProcessExpired()
    {
        await _service.ProcessExpiredReservationsAsync();
        return Ok(new { message = "Expired reservations processed." });
    }
}