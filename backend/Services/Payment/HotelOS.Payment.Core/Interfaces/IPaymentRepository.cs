using HotelOS.Payment.Core.Entities;

namespace HotelOS.Payment.Core.Interfaces;

public interface IPaymentRepository
{
    Task<PaymentRecord?> GetByIdAsync(Guid id);
    Task<IEnumerable<PaymentRecord>> GetAllAsync();
    Task<PaymentRecord?> GetByBookingIdAsync(Guid bookingId);
    Task<PaymentRecord?> GetByStripeIntentIdAsync(string intentId);
    Task AddAsync(PaymentRecord payment);
    Task UpdateAsync(PaymentRecord payment);
}