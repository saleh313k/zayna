using Google.Apis.Auth;
using Zayna.Core.Exceptions;
using Zayna.Core.Interfaces;

namespace ZAYNA.Infrastructure.Services
{
    /// <summary>
    /// Verifies Google ID tokens server-side: signature (Google's public keys), expiry,
    /// issuer, and that the token was issued for THIS application's client id.
    /// </summary>
    public class GoogleTokenVerifier : IGoogleTokenVerifier
    {
        private readonly string _clientId;
        private readonly ILogger<GoogleTokenVerifier> _logger;

        public GoogleTokenVerifier(IConfiguration configuration, ILogger<GoogleTokenVerifier> logger)
        {
            _clientId = configuration["GoogleSettings:ClientId"] ?? string.Empty;
            _logger = logger;
        }

        public async Task<GoogleIdentity?> VerifyAsync(string idToken)
        {
            if (string.IsNullOrWhiteSpace(idToken) || string.IsNullOrWhiteSpace(_clientId))
                return null;

            try
            {
                var payload = await GoogleJsonWebSignature.ValidateAsync(
                    idToken,
                    new GoogleJsonWebSignature.ValidationSettings
                    {
                        Audience = new[] { _clientId }
                    });

                return new GoogleIdentity(
                    payload.Subject,
                    payload.Email ?? string.Empty,
                    payload.EmailVerified,
                    payload.Name);
            }
            catch (InvalidJwtException ex)
            {
                _logger.LogWarning("Rejected invalid Google ID token: {Reason}", ex.Message);
                return null;
            }
            catch (HttpRequestException ex)
            {
                // Could not download Google's public signing keys (network, proxy, firewall, VPN...).
                // This is not the user's fault and not an invalid token, so report it distinctly.
                _logger.LogError(ex,
                    "Could not reach Google to fetch signing certificates (https://www.googleapis.com/oauth2/v3/certs). " +
                    "Check outbound network access, proxy, VPN or firewall from this server.");
                throw new AppException("GOOGLE_UNREACHABLE",
                    "Could not reach Google to verify your sign-in. Please try again in a moment.");
            }
        }
    }
}
