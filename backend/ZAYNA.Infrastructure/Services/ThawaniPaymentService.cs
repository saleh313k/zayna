// ZAYNA.Infrastructure/Services/ThawaniPaymentService.cs
using System.Text;
using System.Text.Json;
using ZAYNA.Core.Enums;

namespace ZAYNA.Infrastructure.Services
{
    public class ThawaniPaymentService : IPaymentService
    {
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public ThawaniPaymentService(IConfiguration configuration, IHttpClientFactory httpClientFactory)
        {
            _configuration = configuration;
            _httpClient = httpClientFactory.CreateClient();
            _httpClient.DefaultRequestHeaders.Add("thawani-api-key", _configuration["ThawaniSettings:ApiKey"]);
        }

        public async Task<(bool Success, string TransactionId, string CheckoutUrl)> CreatePaymentAsync(Booking booking)
        {
            try
            {
                var baseUrl = _configuration["ThawaniSettings:BaseUrl"];
                var payload = new
                {
                    client_reference_id = booking.Id.ToString(),
                    mode = "payment",
                    products = new[]
                    {
                        new
                        {
                            name = $"Booking - {booking.BookingNumber}",
                            quantity = 1,
                            unit_amount = (int)(booking.TotalAmount * 1000) // Convert to Baisa
                        }
                    },
                    success_url = $"https://zayna.om/booking/success?id={booking.Id}",
                    cancel_url = $"https://zayna.om/booking/cancel?id={booking.Id}",
                    metadata = new
                    {
                        booking_id = booking.Id,
                        customer_id = booking.CustomerId
                    }
                };

                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync($"{baseUrl}/checkout/session", content);

                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadAsStringAsync();
                    var jsonResult = JsonSerializer.Deserialize<JsonElement>(result);
                    var sessionId = jsonResult.GetProperty("data").GetProperty("session_id").GetString();
                    var checkoutUrl = $"{baseUrl}/checkout/{sessionId}";
                    
                    return (true, sessionId, checkoutUrl);
                }

                return (false, null, null);
            }
            catch
            {
                return (false, null, null);
            }
        }

        public async Task<(bool Success, PaymentStatus Status)> VerifyPaymentAsync(string transactionId)
        {
            try
            {
                var baseUrl = _configuration["ThawaniSettings:BaseUrl"];
                var response = await _httpClient.GetAsync($"{baseUrl}/checkout/session/{transactionId}");

                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadAsStringAsync();
                    var jsonResult = JsonSerializer.Deserialize<JsonElement>(result);
                    var status = jsonResult.GetProperty("data").GetProperty("payment_status").GetString();

                    return status switch
                    {
                        "paid" => (true, PaymentStatus.Completed),
                        "unpaid" => (true, PaymentStatus.Pending),
                        "cancelled" => (true, PaymentStatus.Failed),
                        _ => (false, PaymentStatus.Pending)
                    };
                }

                return (false, PaymentStatus.Failed);
            }
            catch
            {
                return (false, PaymentStatus.Failed);
            }
        }

        public async Task<bool> RefundPaymentAsync(string transactionId, decimal amount)
        {
            // Thawani refund implementation
            await Task.CompletedTask;
            return false; // Placeholder
        }

        public Task<(bool Success, string TransactionId, string CheckoutUrl)> CreateGeneralPaymentAsync(decimal amount, string description, Guid? customerId = null)
        {
            throw new NotImplementedException();
        }

        public Task<bool> CancelPaymentAsync(string transactionId)
        {
            throw new NotImplementedException();
        }

        public Task<bool> SavePaymentCallbackAsync(string payload)
        {
            throw new NotImplementedException();
        }
    }
}
