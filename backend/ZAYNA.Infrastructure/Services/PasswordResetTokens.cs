using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace ZAYNA.Infrastructure.Services
{
    /// <summary>
    /// Stateless, signed password-reset tokens (no database table).
    ///
    /// Token = {userId}.{expiryUnixSeconds}.{HMAC-SHA256 signature}, where the signature also covers the user's CURRENT
    /// password hash. That makes a token:
    ///   * unforgeable (needs the server key),
    ///   * time-limited (expiry is signed),
    ///   * single-use (once the password changes, the hash changes and every earlier token stops verifying).
    /// The password hash is only an input to the signature; it is never part of the token.
    /// </summary>
    public static class PasswordResetTokens
    {
        private const int MaxTokenLength = 256;

        public static string Create(byte[] key, Guid userId, DateTime expiresUtc, string passwordHash)
        {
            var expiry = ToUnixSeconds(expiresUtc);
            var payload = userId.ToString("N") + "." + expiry.ToString(CultureInfo.InvariantCulture);
            return payload + "." + Sign(key, payload, passwordHash);
        }

        /// <summary>Reads the (unverified!) user id so the caller can load that user's password hash and then call <see cref="IsValid"/>.</summary>
        public static bool TryReadUserId(string? token, out Guid userId)
        {
            userId = Guid.Empty;
            var parts = Split(token);
            return parts != null && Guid.TryParseExact(parts[0], "N", out userId);
        }

        public static bool IsValid(byte[] key, string? token, string passwordHash, DateTime nowUtc)
        {
            var parts = Split(token);
            if (parts == null) return false;
            if (!long.TryParse(parts[1], NumberStyles.None, CultureInfo.InvariantCulture, out var expiry)) return false;
            if (ToUnixSeconds(nowUtc) > expiry) return false;

            var expected = Sign(key, parts[0] + "." + parts[1], passwordHash);
            return CryptographicOperations.FixedTimeEquals(
                Encoding.ASCII.GetBytes(expected), Encoding.ASCII.GetBytes(parts[2]));
        }

        public static byte[] DeriveKey(string secret) =>
            SHA256.HashData(Encoding.UTF8.GetBytes("zayna-password-reset-v1|" + secret));

        private static string[]? Split(string? token)
        {
            if (string.IsNullOrWhiteSpace(token) || token.Length > MaxTokenLength) return null;
            var parts = token.Trim().Split('.');
            return parts.Length == 3 && parts.All(p => p.Length > 0) ? parts : null;
        }

        private static string Sign(byte[] key, string payload, string passwordHash)
        {
            using var hmac = new HMACSHA256(key);
            var mac = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload + "|" + passwordHash));
            return Convert.ToBase64String(mac).TrimEnd('=').Replace('+', '-').Replace('/', '_');
        }

        private static long ToUnixSeconds(DateTime utc) =>
            new DateTimeOffset(DateTime.SpecifyKind(utc, DateTimeKind.Utc)).ToUnixTimeSeconds();
    }
}
