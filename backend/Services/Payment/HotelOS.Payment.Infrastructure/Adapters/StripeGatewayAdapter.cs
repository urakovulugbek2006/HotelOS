using Stripe;

namespace HotelOS.Payment.Infrastructure.Adapters;

public class StripeGatewayAdapter
{
    public StripeGatewayAdapter(string secretKey)
    {
        StripeConfiguration.ApiKey = secretKey;
    }

    public async Task<PaymentIntent> CreatePaymentIntentAsync(
        double amount, string currency, Guid bookingId)
    {
        var options = new PaymentIntentCreateOptions
        {
            Amount   = (long)(amount * 100), // Stripe uses cents
            Currency = currency.ToLower(),
            Metadata = new Dictionary<string, string>
            {
                { "bookingId", bookingId.ToString() }
            },
            AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
            {
                Enabled = true
            }
        };

        var service = new PaymentIntentService();
        return await service.CreateAsync(options);
    }

    public async Task<PaymentIntent> GetPaymentIntentAsync(string intentId)
    {
        var service = new PaymentIntentService();
        return await service.GetAsync(intentId);
    }

    public async Task<Refund> CreateRefundAsync(string paymentIntentId)
    {
        var options = new RefundCreateOptions
        {
            PaymentIntent = paymentIntentId
        };
        var service = new RefundService();
        return await service.CreateAsync(options);
    }

    public Event ConstructWebhookEvent(
        string payload, string signature, string webhookSecret)
        => EventUtility.ConstructEvent(payload, signature, webhookSecret);
}