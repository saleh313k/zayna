using System.Globalization;
using System.Net;
using System.Text;

namespace ZAYNA.Infrastructure.Services
{
    /// <summary>Plain data needed to render a booking email (no entities, easy to unit test).</summary>
    public sealed record BookingEmailModel(
        string? BookingNumber,
        string? CustomerName,
        string? SalonName,
        string? SalonNameAr,
        string? ServiceName,
        string? ServiceNameAr,
        string? StylistName,
        string? StylistNameAr,
        string? Address,
        DateTime Date,
        TimeSpan Time,
        decimal TotalPrice,
        string? Reason)
    {
        public static BookingEmailModel FromBooking(Booking b)
        {
            var addressParts = new[] { b.Branch?.AddressLine, b.Branch?.City }
                .Where(p => !string.IsNullOrWhiteSpace(p));
            var address = string.Join(", ", addressParts);
            if (address.Length == 0) address = b.Branch?.BranchName ?? string.Empty;

            return new BookingEmailModel(
                b.BookingNumber,
                b.Customer?.User?.FullName,
                b.Salon?.SalonName,
                b.Salon?.SalonNameAr,
                b.Service?.ServiceName,
                b.Service?.ServiceNameAr,
                b.Stylist?.FullName,
                b.Stylist?.FullNameAr,
                address,
                b.BookingDate.Date,
                b.StartTime,
                b.TotalPrice,
                b.CancellationReason);
        }
    }

    /// <summary>
    /// Bilingual (English + Arabic in one message) transactional emails. Every dynamic value is HTML-encoded:
    /// names and cancellation reasons are entered by users and must never be able to inject markup.
    /// </summary>
    public static class EmailTemplates
    {
        public sealed record EmailContent(string Subject, string Html);

        private static string E(string? value) => WebUtility.HtmlEncode(value ?? string.Empty);

        private static string Clean(string value) => value.Replace('\r', ' ').Replace('\n', ' ').Trim();

        private static string FormatDate(DateTime d) => d.ToString("ddd, dd MMM yyyy", CultureInfo.InvariantCulture);

        private static string FormatDateAr(DateTime d) => d.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);

        private static string FormatTime(TimeSpan t) => t.ToString(@"hh\:mm", CultureInfo.InvariantCulture);

        private static string FormatPrice(decimal p) => p.ToString("0.000", CultureInfo.InvariantCulture) + " OMR";

        private static string Row(string label, string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return string.Empty;
            return "<tr><td style=\"padding:4px 12px 4px 0;color:#666\">" + E(label) +
                   "</td><td style=\"padding:4px 0\"><strong>" + E(value) + "</strong></td></tr>";
        }

        private static string Table(string rows) =>
            rows.Length == 0 ? string.Empty : "<table style=\"border-collapse:collapse;margin:12px 0\">" + rows + "</table>";

        private static string Section(string heading, string intro, string rows) =>
            "<h2 style=\"margin:0 0 8px;font-size:18px\">" + E(heading) + "</h2>" +
            "<p style=\"margin:0 0 8px\">" + E(intro) + "</p>" + Table(rows);

        private static string Wrap(string en, string ar) =>
            "<!DOCTYPE html><html><body style=\"margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;color:#222\">" +
            "<div style=\"max-width:560px;margin:0 auto;padding:24px\">" +
            "<div style=\"background:#ffffff;border-radius:8px;padding:24px\">" +
            "<div style=\"font-size:20px;font-weight:bold;letter-spacing:2px;margin-bottom:16px\">ZAYNA</div>" +
            en +
            "<hr style=\"border:none;border-top:1px solid #e5e5ea;margin:24px 0\"/>" +
            "<div dir=\"rtl\" lang=\"ar\" style=\"text-align:right\">" + ar + "</div>" +
            "</div></div></body></html>";

        private static string DetailsEn(BookingEmailModel m) =>
            Row("Booking #", m.BookingNumber) +
            Row("Salon", m.SalonName) +
            Row("Service", m.ServiceName) +
            Row("Stylist", m.StylistName) +
            Row("Date", FormatDate(m.Date)) +
            Row("Time", FormatTime(m.Time)) +
            Row("Address", m.Address) +
            Row("Total", FormatPrice(m.TotalPrice));

        private static string DetailsAr(BookingEmailModel m) =>
            Row("رقم الحجز", m.BookingNumber) +
            Row("الصالون", string.IsNullOrWhiteSpace(m.SalonNameAr) ? m.SalonName : m.SalonNameAr) +
            Row("الخدمة", string.IsNullOrWhiteSpace(m.ServiceNameAr) ? m.ServiceName : m.ServiceNameAr) +
            Row("الأخصائي", string.IsNullOrWhiteSpace(m.StylistNameAr) ? m.StylistName : m.StylistNameAr) +
            Row("التاريخ", FormatDateAr(m.Date)) +
            Row("الوقت", FormatTime(m.Time)) +
            Row("العنوان", m.Address) +
            Row("الإجمالي", FormatPrice(m.TotalPrice));

        private static string Greeting(string? name, bool arabic)
        {
            if (string.IsNullOrWhiteSpace(name)) return arabic ? "مرحباً،" : "Hello,";
            return (arabic ? "مرحباً " : "Hello ") + name.Trim() + (arabic ? "،" : ",");
        }

        public static EmailContent BookingConfirmed(BookingEmailModel m)
        {
            var en = Section("Your booking is confirmed",
                Greeting(m.CustomerName, false) + " thank you for booking with ZAYNA.", DetailsEn(m));
            var ar = Section("تم تأكيد حجزك",
                Greeting(m.CustomerName, true) + " شكراً لحجزك عبر زينة.", DetailsAr(m));
            return new EmailContent(
                Clean($"Booking confirmed #{m.BookingNumber} | تم تأكيد الحجز #{m.BookingNumber}"),
                Wrap(en, ar));
        }

        public static EmailContent BookingCancelled(BookingEmailModel m)
        {
            var reasonEn = Row("Reason", m.Reason);
            var reasonAr = Row("السبب", m.Reason);
            var en = Section("Your booking was cancelled",
                Greeting(m.CustomerName, false) + " the booking below has been cancelled.", DetailsEn(m) + reasonEn);
            var ar = Section("تم إلغاء حجزك",
                Greeting(m.CustomerName, true) + " تم إلغاء الحجز التالي.", DetailsAr(m) + reasonAr);
            return new EmailContent(
                Clean($"Booking cancelled #{m.BookingNumber} | تم إلغاء الحجز #{m.BookingNumber}"),
                Wrap(en, ar));
        }

        public static EmailContent BookingReminder(BookingEmailModel m)
        {
            var en = Section("Appointment reminder",
                Greeting(m.CustomerName, false) + " this is a reminder of your upcoming appointment.", DetailsEn(m));
            var ar = Section("تذكير بموعدك",
                Greeting(m.CustomerName, true) + " نذكّرك بموعدك القادم.", DetailsAr(m));
            return new EmailContent(
                Clean($"Reminder: your appointment at {FormatTime(m.Time)} | تذكير بموعدك الساعة {FormatTime(m.Time)}"),
                Wrap(en, ar));
        }

        private static string Button(string url, string label) =>
            "<p style=\"margin:16px 0\"><a href=\"" + E(url) + "\" style=\"background:#111;color:#fff;text-decoration:none;" +
            "padding:10px 18px;border-radius:6px;display:inline-block\">" + E(label) + "</a></p>";

        public static EmailContent PasswordReset(string? name, string link, int validMinutes)
        {
            var en = "<h2 style=\"margin:0 0 8px;font-size:18px\">Reset your password</h2>" +
                     "<p style=\"margin:0 0 8px\">" + E(Greeting(name, false)) + " we received a request to reset your ZAYNA password.</p>" +
                     Button(link, "Choose a new password") +
                     "<p style=\"margin:0;color:#666\">This link works once and expires in " + validMinutes.ToString(CultureInfo.InvariantCulture) +
                     " minutes. If you did not ask for this, you can ignore this email; your password will not change.</p>";
            var ar = "<h2 style=\"margin:0 0 8px;font-size:18px\">إعادة تعيين كلمة المرور</h2>" +
                     "<p style=\"margin:0 0 8px\">" + E(Greeting(name, true)) + " وصلنا طلب لإعادة تعيين كلمة مرور حسابك في زينة.</p>" +
                     Button(link, "اختيار كلمة مرور جديدة") +
                     "<p style=\"margin:0;color:#666\">يعمل هذا الرابط مرة واحدة فقط وينتهي خلال " + validMinutes.ToString(CultureInfo.InvariantCulture) +
                     " دقيقة. إذا لم تطلب ذلك فتجاهل هذه الرسالة ولن تتغير كلمة مرورك.</p>";
            return new EmailContent("Reset your ZAYNA password | إعادة تعيين كلمة المرور", Wrap(en, ar));
        }

        public static EmailContent UseGoogleSignIn(string? name, string loginUrl)
        {
            var en = "<h2 style=\"margin:0 0 8px;font-size:18px\">Sign in with Google</h2>" +
                     "<p style=\"margin:0 0 8px\">" + E(Greeting(name, false)) + " your ZAYNA account uses Google sign-in, so it has no password to reset.</p>" +
                     Button(loginUrl, "Go to sign in");
            var ar = "<h2 style=\"margin:0 0 8px;font-size:18px\">سجّل الدخول عبر جوجل</h2>" +
                     "<p style=\"margin:0 0 8px\">" + E(Greeting(name, true)) + " حسابك في زينة يستخدم تسجيل الدخول عبر جوجل، لذلك لا توجد كلمة مرور لإعادة تعيينها.</p>" +
                     Button(loginUrl, "الانتقال إلى تسجيل الدخول");
            return new EmailContent("Your ZAYNA account uses Google sign-in | حسابك يستخدم جوجل", Wrap(en, ar));
        }

        public static EmailContent PasswordChanged(string? name)
        {
            var en = "<h2 style=\"margin:0 0 8px;font-size:18px\">Your password was changed</h2>" +
                     "<p style=\"margin:0\">" + E(Greeting(name, false)) + " the password of your ZAYNA account was just changed. " +
                     "If this was not you, reset your password immediately and contact support.</p>";
            var ar = "<h2 style=\"margin:0 0 8px;font-size:18px\">تم تغيير كلمة المرور</h2>" +
                     "<p style=\"margin:0\">" + E(Greeting(name, true)) + " تم تغيير كلمة مرور حسابك في زينة للتو. " +
                     "إذا لم تكن أنت، فأعد تعيين كلمة المرور فوراً وتواصل مع الدعم.</p>";
            return new EmailContent("Your ZAYNA password was changed | تم تغيير كلمة المرور", Wrap(en, ar));
        }

        public static EmailContent Otp(string code)
        {
            var codeHtml = "<p style=\"font-size:28px;letter-spacing:4px;font-weight:bold;margin:12px 0\">" + E(code) + "</p>";
            var en = "<h2 style=\"margin:0 0 8px;font-size:18px\">Your verification code</h2>" + codeHtml +
                     "<p style=\"margin:0\">This code expires in 5 minutes. If you did not request it, ignore this email.</p>";
            var ar = "<h2 style=\"margin:0 0 8px;font-size:18px\">رمز التحقق الخاص بك</h2>" + codeHtml +
                     "<p style=\"margin:0\">ينتهي هذا الرمز خلال 5 دقائق. إذا لم تطلبه فتجاهل هذه الرسالة.</p>";
            return new EmailContent("ZAYNA verification code | رمز التحقق", Wrap(en, ar));
        }

        /// <summary>Generic message used by the legacy IEmailService.SendBookingConfirmationAsync(string, string).</summary>
        public static EmailContent PlainDetails(string details)
        {
            var en = "<h2 style=\"margin:0 0 8px;font-size:18px\">Booking confirmed</h2><p>" + E(details) + "</p>";
            var ar = "<h2 style=\"margin:0 0 8px;font-size:18px\">تم تأكيد الحجز</h2><p>" + E(details) + "</p>";
            return new EmailContent("Your booking is confirmed | تم تأكيد حجزك", Wrap(en, ar));
        }

        /// <summary>Strips tags for the text/plain alternative part (clients that do not render HTML).</summary>
        public static string ToPlainText(string html)
        {
            var sb = new StringBuilder(html.Length);
            var inTag = false;
            foreach (var ch in html)
            {
                if (ch == '<') { inTag = true; continue; }
                if (ch == '>') { inTag = false; sb.Append(' '); continue; }
                if (!inTag) sb.Append(ch);
            }
            var decoded = WebUtility.HtmlDecode(sb.ToString());
            return string.Join(" ", decoded.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
        }
    }
}
