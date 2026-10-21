using Google.Apis.Auth;
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
        }
    }
}
