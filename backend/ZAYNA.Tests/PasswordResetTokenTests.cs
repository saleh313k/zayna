using Xunit;
using ZAYNA.Infrastructure.Services;

namespace ZAYNA.Tests;

/// <summary>The reset token is the only thing standing between an email link and an account: test it hard.</summary>
public class PasswordResetTokenTests
{
    private static readonly byte[] Key = PasswordResetTokens.DeriveKey("unit-test-secret-key-that-is-long-enough-123456");
    private static readonly Guid UserId = Guid.Parse("a1b2c3d4-e5f6-4789-abcd-ef0123456789");
    private const string Hash = "$2a$12$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ0123456";
    private static readonly DateTime Now = new(2030, 6, 1, 12, 0, 0, DateTimeKind.Utc);

    private static string NewToken(DateTime? expires = null, string hash = Hash) =>
        PasswordResetTokens.Create(Key, UserId, expires ?? Now.AddMinutes(60), hash);

    [Fact]
    public void A_fresh_token_is_valid_and_exposes_the_user_id()
    {
        var token = NewToken();

        Assert.True(PasswordResetTokens.TryReadUserId(token, out var id));
        Assert.Equal(UserId, id);
        Assert.True(PasswordResetTokens.IsValid(Key, token, Hash, Now));
    }

    [Fact]
    public void An_expired_token_is_rejected()
    {
        var token = NewToken(expires: Now.AddMinutes(60));
        Assert.True(PasswordResetTokens.IsValid(Key, token, Hash, Now.AddMinutes(59)));
        Assert.False(PasswordResetTokens.IsValid(Key, token, Hash, Now.AddMinutes(61)));
    }

    [Fact]
    public void Changing_the_password_invalidates_the_token_so_it_is_single_use()
    {
        var token = NewToken();
        Assert.False(PasswordResetTokens.IsValid(Key, token, "$2a$12$a-different-hash-after-the-password-was-changed", Now));
    }

    [Fact]
    public void A_token_signed_with_another_key_is_rejected()
    {
        var otherKey = PasswordResetTokens.DeriveKey("a-completely-different-server-secret-0987654321");
        var forged = PasswordResetTokens.Create(otherKey, UserId, Now.AddMinutes(60), Hash);
        Assert.False(PasswordResetTokens.IsValid(Key, forged, Hash, Now));
    }

    [Fact]
    public void Tampering_with_the_user_id_or_expiry_is_rejected()
    {
        var parts = NewToken().Split('.');

        var otherUser = Guid.NewGuid().ToString("N") + "." + parts[1] + "." + parts[2];
        var longerExpiry = parts[0] + "." + (long.Parse(parts[1]) + 100000) + "." + parts[2];

        Assert.False(PasswordResetTokens.IsValid(Key, otherUser, Hash, Now));
        Assert.False(PasswordResetTokens.IsValid(Key, longerExpiry, Hash, Now));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("garbage")]
    [InlineData("a.b")]
    [InlineData("a.b.c.d")]
    [InlineData("..")]
    [InlineData("not-a-guid.123.sig")]
    public void Malformed_tokens_are_rejected_without_throwing(string? token)
    {
        Assert.False(PasswordResetTokens.TryReadUserId(token, out _));
        Assert.False(PasswordResetTokens.IsValid(Key, token, Hash, Now));
    }

    [Fact]
    public void An_oversized_token_is_rejected()
    {
        Assert.False(PasswordResetTokens.IsValid(Key, new string('a', 5000), Hash, Now));
    }

    [Fact]
    public void Token_characters_are_safe_for_a_url_fragment()
    {
        var token = NewToken();
        Assert.Matches("^[0-9a-f]{32}\\.[0-9]+\\.[A-Za-z0-9_-]+$", token);
    }
}

public class PasswordEmailTemplateTests
{
    [Fact]
    public void Reset_email_contains_the_link_and_expiry_in_both_languages()
    {
        var link = "https://zayna.example/reset-password#token=abc.123.sig";
        var email = EmailTemplates.PasswordReset("Aisha", link, 60);

        Assert.Contains(link, email.Html);
        Assert.Contains("60 minutes", email.Html);
        Assert.Contains("60 دقيقة", email.Html);
        Assert.Contains("dir=\"rtl\"", email.Html);
    }

    [Fact]
    public void Reset_email_encodes_the_users_name()
    {
        var email = EmailTemplates.PasswordReset("<script>x</script>", "https://zayna.example/reset-password#token=a.1.b", 60);
        Assert.DoesNotContain("<script>", email.Html);
    }

    [Fact]
    public void Google_only_and_password_changed_emails_render()
    {
        Assert.Contains("https://zayna.example/login", EmailTemplates.UseGoogleSignIn("Ali", "https://zayna.example/login").Html);
        Assert.Contains("changed", EmailTemplates.PasswordChanged("Ali").Html);
    }
}
