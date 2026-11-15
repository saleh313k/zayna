using Xunit;
using ZAYNA.Infrastructure.Services;

namespace ZAYNA.Tests;

/// <summary>Pure-logic tests of reminder timing (no database, no clock, no network).</summary>
public class ReminderPolicyTests
{
    private static readonly TimeSpan Lead = TimeSpan.FromHours(2);
    private static readonly DateTime Start = new(2030, 1, 5, 14, 0, 0);
    private static readonly DateTime BookedLongAgo = Start.AddDays(-3);

    [Fact]
    public void Not_due_before_the_window_opens()
    {
        Assert.False(ReminderPolicy.IsDue(Start.AddHours(-3), Start, BookedLongAgo, Lead));
    }

    [Fact]
    public void Due_inside_the_window()
    {
        Assert.True(ReminderPolicy.IsDue(Start.AddMinutes(-119), Start, BookedLongAgo, Lead));
        Assert.True(ReminderPolicy.IsDue(Start.AddMinutes(-120), Start, BookedLongAgo, Lead));
        Assert.True(ReminderPolicy.IsDue(Start.AddMinutes(-5), Start, BookedLongAgo, Lead));
    }

    [Fact]
    public void Still_due_after_a_missed_tick_as_long_as_the_appointment_has_not_started()
    {
        // e.g. the API was down at the 2h mark and came back 30 minutes before the appointment.
        Assert.True(ReminderPolicy.IsDue(Start.AddMinutes(-30), Start, BookedLongAgo, Lead));
    }

    [Fact]
    public void Never_due_once_the_appointment_has_started()
    {
        Assert.False(ReminderPolicy.IsDue(Start, Start, BookedLongAgo, Lead));
        Assert.False(ReminderPolicy.IsDue(Start.AddMinutes(10), Start, BookedLongAgo, Lead));
    }

    [Fact]
    public void Not_due_when_booked_less_than_the_lead_time_before_the_start()
    {
        var bookedAtLastMinute = Start.AddMinutes(-45);
        Assert.False(ReminderPolicy.IsDue(Start.AddMinutes(-30), Start, bookedAtLastMinute, Lead));
    }
}

public class EmailTemplatesTests
{
    private static BookingEmailModel Model(string customer = "Aisha", string? reason = null, string salon = "Luxury Beauty Salon") =>
        new("ZB-1001", customer, salon, "صالون الجمال الفاخر", "Haircut", "قص شعر",
            "Ahmed", "أحمد", "Al Khuwair, Muscat", new DateTime(2030, 1, 5), new TimeSpan(14, 30, 0), 10.5m, reason);

    [Fact]
    public void Confirmation_contains_booking_details_in_both_languages()
    {
        var email = EmailTemplates.BookingConfirmed(Model());

        Assert.Contains("ZB-1001", email.Subject);
        Assert.Contains("ZB-1001", email.Html);
        Assert.Contains("Luxury Beauty Salon", email.Html);
        Assert.Contains("صالون الجمال الفاخر", email.Html);
        Assert.Contains("14:30", email.Html);
        Assert.Contains("10.500 OMR", email.Html);
        Assert.Contains("dir=\"rtl\"", email.Html);
    }

    [Fact]
    public void User_supplied_text_is_html_encoded()
    {
        var email = EmailTemplates.BookingCancelled(
            Model(customer: "<script>alert(1)</script>", reason: "<img src=x onerror=alert(1)>", salon: "A & B <i>Salon</i>"));

        Assert.DoesNotContain("<script>", email.Html);
        Assert.DoesNotContain("<img src=x", email.Html);
        Assert.DoesNotContain("<i>Salon</i>", email.Html);
        Assert.Contains("&lt;script&gt;", email.Html);
        Assert.Contains("A &amp; B", email.Html);
    }

    [Fact]
    public void Cancellation_shows_the_reason_when_given_and_omits_it_otherwise()
    {
        Assert.Contains("Stylist is ill", EmailTemplates.BookingCancelled(Model(reason: "Stylist is ill")).Html);
        Assert.DoesNotContain("Reason", EmailTemplates.BookingCancelled(Model(reason: null)).Html);
    }

    [Fact]
    public void Subject_never_contains_line_breaks()
    {
        var email = EmailTemplates.BookingConfirmed(Model() with { BookingNumber = "ZB-1\r\nBcc: evil@example.com" });
        Assert.DoesNotContain('\n', email.Subject);
        Assert.DoesNotContain('\r', email.Subject);
    }

    [Fact]
    public void Plain_text_version_has_no_tags()
    {
        var text = EmailTemplates.ToPlainText(EmailTemplates.BookingConfirmed(Model()).Html);
        Assert.DoesNotContain("<", text);
        Assert.Contains("ZB-1001", text);
    }

    [Fact]
    public void Otp_email_contains_the_code()
    {
        Assert.Contains("123456", EmailTemplates.Otp("123456").Html);
    }
}
