namespace Zayna.Core.Interfaces
{
    public record GoogleIdentity(string Subject, string Email, bool EmailVerified, string? Name);

    public interface IGoogleTokenVerifier
    {
        /// <summary>
        /// Verifies a Google ID token (signature, expiry, issuer and audience).
        /// Returns null when the token is invalid.
        /// </summary>
        Task<GoogleIdentity?> VerifyAsync(string idToken);
    }
}
