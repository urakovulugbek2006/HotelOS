using HotelOS.Payment.Core.Entities;
using HotelOS.Payment.Core.Interfaces;
using HotelOS.Payment.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HotelOS.Payment.Infrastructure.Repositories;

public class PaymentRepository : IPaymentRepository
{
    private readonly PaymentDbContext _db;

    public PaymentRepository(PaymentDbContext db) => _db = db;

    public async Task<PaymentRecord?> GetByIdAsync(Guid id)
        => await _db.Payments.FirstOrDefaultAsync(p => p.Id == id);

    public async Task<IEnumerable<PaymentRecord>> GetAllAsync()
        => await _db.Payments.OrderByDescending(p => p.CreatedAt).ToListAsync();

    public async Task<PaymentRecord?> GetByBookingIdAsync(Guid bookingId)
        => await _db.Payments.FirstOrDefaultAsync(p => p.BookingId == bookingId);

    public async Task<PaymentRecord?> GetByStripeIntentIdAsync(string intentId)
        => await _db.Payments.FirstOrDefaultAsync(
            p => p.StripePaymentIntentId == intentId);

    public async Task AddAsync(PaymentRecord payment)
    {
        await _db.Payments.AddAsync(payment);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(PaymentRecord payment)
    {
        _db.Payments.Update(payment);
        await _db.SaveChangesAsync();
    }
}