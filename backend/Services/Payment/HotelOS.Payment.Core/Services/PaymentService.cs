using HotelOS.Payment.Core.Entities;
using HotelOS.Payment.Core.Enums;
using HotelOS.Payment.Core.Interfaces;

namespace HotelOS.Payment.Core.Services;

public class PaymentService : IPaymentService
{
    private readonly IPaymentRepository _repo;

    public PaymentService(IPaymentRepository repo) => _repo = repo;

    public async Task<PaymentRecord> InitiatePaymentAsync(
        Guid bookingId, Guid guestId, double amount, string currency)
    {
        var existing = await _repo.GetByBookingIdAsync(bookingId);
        if (existing is not null)
            throw new InvalidOperationException(
                "Payment already initiated for this booking.");

        var payment = new PaymentRecord
        {
            Id        = Guid.NewGuid(),
            BookingId = bookingId,
            GuestId   = guestId,
            Amount    = amount,
            Currency  = currency,
            Status    = PaymentStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await _repo.AddAsync(payment);
        return payment;
    }

    public async Task<PaymentRecord> ConfirmPaymentAsync(string stripePaymentIntentId)
    {
        var payment = await _repo.GetByStripeIntentIdAsync(stripePaymentIntentId)
            ?? throw new KeyNotFoundException(
                $"Payment not found for intent {stripePaymentIntentId}");

        payment.Status      = PaymentStatus.Completed;
        payment.GatewayRef  = stripePaymentIntentId;
        payment.CompletedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(payment);
        return payment;
    }

    public async Task<PaymentRecord> FailPaymentAsync(
        string stripePaymentIntentId, string reason)
    {
        var payment = await _repo.GetByStripeIntentIdAsync(stripePaymentIntentId)
            ?? throw new KeyNotFoundException(
                $"Payment not found for intent {stripePaymentIntentId}");

        payment.Status        = PaymentStatus.Failed;
        payment.FailureReason = reason;
        await _repo.UpdateAsync(payment);
        return payment;
    }

    public async Task<PaymentRecord> RefundPaymentAsync(Guid bookingId)
    {
        var payment = await _repo.GetByBookingIdAsync(bookingId)
            ?? throw new KeyNotFoundException(
                $"Payment not found for booking {bookingId}");

        if (payment.Status != PaymentStatus.Completed)
            throw new InvalidOperationException(
                "Only completed payments can be refunded.");

        payment.Status = PaymentStatus.Refunded;
        await _repo.UpdateAsync(payment);
        return payment;
    }

    public async Task<IEnumerable<PaymentRecord>> GetAllPaymentsAsync()
        => await _repo.GetAllAsync();

    public async Task<PaymentRecord> ConfirmManualAsync(Guid paymentId)
    {
        var payment = await _repo.GetByIdAsync(paymentId)
            ?? throw new KeyNotFoundException($"Payment {paymentId} not found.");

        if (payment.Status == PaymentStatus.Completed)
            throw new InvalidOperationException("Payment is already confirmed.");

        payment.Status      = PaymentStatus.Completed;
        payment.GatewayRef  = $"MANUAL-{paymentId:N}";
        payment.CompletedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(payment);
        return payment;
    }

    public async Task<PaymentRecord?> GetByBookingIdAsync(Guid bookingId)
        => await _repo.GetByBookingIdAsync(bookingId);
}