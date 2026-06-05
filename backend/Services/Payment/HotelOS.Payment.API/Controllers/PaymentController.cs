using HotelOS.Payment.API.DTOs;
using HotelOS.Payment.Core.Interfaces;
using HotelOS.Payment.Infrastructure.Adapters;
using HotelOS.Shared.Contracts.Events;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HotelOS.Payment.API.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentController : ControllerBase
{
    private readonly IPaymentService    _service;
    private readonly StripeGatewayAdapter _stripe;
    private readonly IPublishEndpoint   _broker;
    private readonly IConfiguration    _config;

    public PaymentController(
        IPaymentService     service,
        StripeGatewayAdapter stripe,
        IPublishEndpoint    broker,
        IConfiguration     config)
    {
        _service = service;
        _stripe  = stripe;
        _broker  = broker;
        _config  = config;
    }

    [HttpPost("initiate")]
    [Authorize(Roles = "Client")]
    public async Task<IActionResult> Initiate(
        [FromBody] InitiatePaymentRequest request)
    {
        try
        {
            var guestId = Guid.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            // create payment record
            var payment = await _service.InitiatePaymentAsync(
                request.BookingId, guestId,
                request.Amount, request.Currency);

            // create Stripe PaymentIntent — returns client secret to frontend
            var intent = await _stripe.CreatePaymentIntentAsync(
                request.Amount, request.Currency, request.BookingId);

            // store stripe intent id
            payment.StripePaymentIntentId = intent.Id;
            payment.StripeClientSecret    = intent.ClientSecret;

            // publish payment.initiated to broker
            await _broker.Publish(new PaymentInitiatedEvent(
                request.BookingId, guestId,
                request.Amount, request.Currency,
                DateTime.UtcNow));

            return Ok(new PaymentResponse(
                payment.Id, payment.BookingId,
                payment.Amount, payment.Currency,
                payment.Status.ToString(),
                intent.ClientSecret,  // frontend uses this to complete payment
                null,
                payment.CreatedAt));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>POST api/payments/webhook — Stripe calls this after payment</summary>
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> Webhook()
    {
        var payload   = await new StreamReader(Request.Body).ReadToEndAsync();
        var signature = Request.Headers["Stripe-Signature"].ToString();
        var secret    = _config["Stripe:WebhookSecret"]!;

        try
        {
            var stripeEvent = _stripe.ConstructWebhookEvent(
                payload, signature, secret);

            if (stripeEvent.Type == "payment_intent.succeeded")
            {
                var intent = stripeEvent.Data.Object as Stripe.PaymentIntent;
                if (intent is null) return BadRequest();

                var payment = await _service.ConfirmPaymentAsync(intent.Id);

                // publish payment.confirmed — Reception confirms booking,
                // Notification pushes to guest
                await _broker.Publish(new PaymentConfirmedEvent(
                    payment.BookingId,
                    payment.GuestId,
                    payment.Id,
                    intent.Id,
                    DateTime.UtcNow));
            }
            else if (stripeEvent.Type == "payment_intent.payment_failed")
            {
                var intent = stripeEvent.Data.Object as Stripe.PaymentIntent;
                if (intent is null) return BadRequest();

                await _service.FailPaymentAsync(
                    intent.Id,
                    intent.LastPaymentError?.Message ?? "Payment failed");
            }

            return Ok();
        }
        catch (Stripe.StripeException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>GET api/payments — all payments (Manager dashboard)</summary>
    [HttpGet]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> GetAll()
    {
        var payments = await _service.GetAllPaymentsAsync();
        return Ok(payments.Select(p => new PaymentResponse(
            p.Id, p.BookingId,
            p.Amount, p.Currency,
            p.Status.ToString(),
            null,
            p.GatewayRef,
            p.CreatedAt)));
    }

    /// <summary>GET api/payments/booking/{bookingId}</summary>
    [HttpGet("booking/{bookingId:guid}")]
    [Authorize]
    public async Task<IActionResult> GetByBooking(Guid bookingId)
    {
        var payment = await _service.GetByBookingIdAsync(bookingId);
        if (payment is null) return NotFound();

        return Ok(new PaymentResponse(
            payment.Id, payment.BookingId,
            payment.Amount, payment.Currency,
            payment.Status.ToString(),
            payment.StripeClientSecret,
            payment.GatewayRef,
            payment.CreatedAt));
    }

    /// <summary>POST api/payments/{id}/confirm-manual — bypass Stripe for testing</summary>
    [HttpPost("{id:guid}/confirm-manual")]
    [Authorize(Roles = "Manager,Receptionist")]
    public async Task<IActionResult> ConfirmManual(Guid id)
    {
        try
        {
            var payment = await _service.ConfirmManualAsync(id);

            await _broker.Publish(new PaymentConfirmedEvent(
                payment.BookingId, payment.GuestId, payment.Id,
                payment.GatewayRef!, DateTime.UtcNow));

            return Ok(new PaymentResponse(
                payment.Id, payment.BookingId,
                payment.Amount, payment.Currency,
                payment.Status.ToString(),
                null, payment.GatewayRef,
                payment.CreatedAt));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>POST api/payments/refund/{bookingId} — Manager only</summary>
    [HttpPost("refund/{bookingId:guid}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Refund(Guid bookingId)
    {
        try
        {
            var payment = await _service.RefundPaymentAsync(bookingId);

            // if has stripe intent, process actual refund
            if (!string.IsNullOrEmpty(payment.StripePaymentIntentId))
                await _stripe.CreateRefundAsync(payment.StripePaymentIntentId);

            return Ok(new { message = "Refund processed.", payment.Id });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }
}