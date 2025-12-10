using ZAYNA.Core.Entities;
using ZAYNA.Core.Enums;

namespace ZAYNA.Core.Interfaces
{
    public interface IPaymentService
    {
        /// <summary>
        /// ایجاد سشن پرداخت در Thawani و دریافت TransactionId و CheckoutUrl
        /// </summary>
        Task<(bool Success, string TransactionId, string CheckoutUrl)> CreatePaymentAsync(Booking booking);

        /// <summary>
        /// دریافت وضعیت پرداخت بر اساس TransactionId
        /// </summary>
        Task<(bool Success, PaymentStatus Status)> VerifyPaymentAsync(string transactionId);

        /// <summary>
        /// بازگشت وجه (Refund) مبلغ مشخص
        /// </summary>
        Task<bool> RefundPaymentAsync(string transactionId, decimal amount);

        /// <summary>
        /// دریافت لینک پرداخت بدون ایجاد Booking (برای پرداخت‌های عمومی)
        /// </summary>
        Task<(bool Success, string TransactionId, string CheckoutUrl)> CreateGeneralPaymentAsync(
            decimal amount,
            string description,
            Guid? customerId = null);

        /// <summary>
        /// لغو پرداخت (در صورت وجود قابلیت در Thawani)
        /// </summary>
        Task<bool> CancelPaymentAsync(string transactionId);

        /// <summary>
        /// ذخیره رسید واکنش callback از Thawani (اگر Webhook داشته باشید)
        /// </summary>
        Task<bool> SavePaymentCallbackAsync(string payload);

        /// <summary>
        /// دریافت تاریخچه پرداخت‌های مشتری
        /// </summary>
        //Task<IEnumerable<PaymentHistory>> GetCustomerPaymentsAsync(Guid customerId);
    }
}
