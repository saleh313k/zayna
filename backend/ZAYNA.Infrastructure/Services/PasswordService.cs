using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Zayna.Core.Exceptions;
using Zayna.Core.Interfaces;
using ZAYNA.Core.Enums;
using ZAYNA.Infrastructure.Data;

namespace ZAYNA.Infrastructure.Services
{
    /// <summary>
    /// Forgot / reset / change password for email+password accounts.
    /// Admins and Google-only accounts have no password to reset (they sign in with Google).
    /// </summary>
    public class PasswordService : IPasswordService
    {
        private const int BcryptWorkFactor = 12;          // same as AuthService
        private const int MaxResetRequestsPerHour = 3;    // per email address (stops email bombing)
        private const int MaxFailedChanges = 5;
        private static readonly TimeSpan ChangeLockout = TimeSpan.FromMinutes(15);

        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IMemoryCache _cache;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IHostEnvironment _environment;
        private readonly ILogger<PasswordService> _logger;
        private readonly byte[] _key;

        private sealed record Throttle(DateTimeOffset WindowStart, int Count);

        public PasswordService(
            ApplicationDbContext context,
            IConfiguration configuration,
            IMemoryCache cache,
            IServiceScopeFactory scopeFactory,
            IHostEnvironment environment,
            ILogger<PasswordService> logger)
        {
            _context = context;
            _configuration = configuration;
            _cache = cache;
            _scopeFactory = scopeFactory;
            _environment = environment;
            _logger = logger;
            // Program.cs refuses to start without a strong JwtSettings:SecretKey; the reset key is derived from it
            // (domain-separated, so a reset token can never be used as a JWT or vice versa).
            _key = PasswordResetTokens.DeriveKey(configuration["JwtSettings:SecretKey"] ?? string.Empty);
        }

        // ---------------------------------------------------------------------------------------------
        public async Task RequestResetAsync(string? rawEmail)
        {
            var email = (rawEmail ?? string.Empty).Trim().ToLowerInvariant();
            if (email.Length == 0 || email.Length > 256) return;

            if (IsThrottled(email)) return;

            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == email);
            if (user == null || !user.IsActive || string.IsNullOrEmpty(user.Email)) return;

            var baseUrl = GetPublicBaseUrl();
            if (baseUrl == null)
            {
                _logger.LogWarning("Password reset email not sent: set App:PublicUrl (or Cors:AllowedOrigins) to the public site URL.");
                return;
            }

            EmailTemplates.EmailContent content;
            if (user.Role == UserRole.Admin || string.IsNullOrEmpty(user.PasswordHash))
            {
                content = EmailTemplates.UseGoogleSignIn(user.FullName, baseUrl + "/login");
            }
            else
            {
                var minutes = GetTokenMinutes();
                var token = PasswordResetTokens.Create(_key, user.Id, DateTime.UtcNow.AddMinutes(minutes), user.PasswordHash);
                // The token travels in the URL fragment: browsers never send it to servers or in Referer headers.
                var link = baseUrl + "/reset-password#token=" + token;
                content = EmailTemplates.PasswordReset(user.FullName, link, minutes);

                if (_environment.IsDevelopment())
                    _logger.LogInformation("DEV ONLY - password reset link for {Email}: {Link}", user.Email, link);
            }

            Dispatch(user.Email, content);
        }

        // ---------------------------------------------------------------------------------------------
        public async Task ResetAsync(string? token, string? newPassword)
        {
            var invalid = new AppException("RESET_TOKEN_INVALID",
                "This reset link is invalid or has expired. Please request a new one.");

            if (!PasswordResetTokens.TryReadUserId(token, out var userId)) throw invalid;

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null || !user.IsActive || user.Role == UserRole.Admin || string.IsNullOrEmpty(user.PasswordHash))
                throw invalid;

            if (!PasswordResetTokens.IsValid(_key, token, user.PasswordHash, DateTime.UtcNow)) throw invalid;

            ValidatePassword(newPassword, user.Email);

            user.PasswordHash = BCrypt.Net.BCrypt.EnhancedHashPassword(newPassword!, BcryptWorkFactor);
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Same key AuthService uses for its sign-in lockout: a reset also clears a lockout.
            if (!string.IsNullOrEmpty(user.Email)) _cache.Remove($"login-fail:{user.Email}");

            NotifyChanged(user);
        }

        // ---------------------------------------------------------------------------------------------
        public async Task ChangeAsync(Guid userId, string? currentPassword, string? newPassword)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null || !user.IsActive)
                throw new AppException("USER_NOT_FOUND", "User not found");

            if (user.Role == UserRole.Admin || string.IsNullOrEmpty(user.PasswordHash))
                throw new AppException("NO_PASSWORD", "This account signs in with Google and has no password to change.");

            var failKey = $"pwchange-fail:{user.Id}";
            _cache.TryGetValue(failKey, out int failures);
            if (failures >= MaxFailedChanges)
                throw new AppException("TOO_MANY_ATTEMPTS", "Too many failed attempts. Please wait 15 minutes and try again.");

            var current = currentPassword ?? string.Empty;
            if (current.Length == 0 || current.Length > 128 ||
                !BCrypt.Net.BCrypt.EnhancedVerify(current, user.PasswordHash))
            {
                _cache.Set(failKey, failures + 1, ChangeLockout);
                throw new AppException("INVALID_CREDENTIALS", "Your current password is incorrect.");
            }

            ValidatePassword(newPassword, user.Email);
            if (string.Equals(current, newPassword, StringComparison.Ordinal))
                throw new AppException("WEAK_PASSWORD", "The new password must be different from the current one.");

            user.PasswordHash = BCrypt.Net.BCrypt.EnhancedHashPassword(newPassword!, BcryptWorkFactor);
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _cache.Remove(failKey);
            NotifyChanged(user);
        }

        // ---------------------------------------------------------------------------------------------
        private bool IsThrottled(string email)
        {
            var key = $"pwreset-req:{email}";
            var now = DateTimeOffset.UtcNow;
            var entry = _cache.TryGetValue(key, out Throttle? existing) && existing != null
                ? existing
                : new Throttle(now, 0);

            if (entry.Count >= MaxResetRequestsPerHour) return true;

            _cache.Set(key, entry with { Count = entry.Count + 1 }, entry.WindowStart.AddHours(1));
            return false;
        }

        private int GetTokenMinutes()
        {
            if (!int.TryParse(_configuration["Auth:ResetTokenMinutes"], out var minutes)) minutes = 60;
            return Math.Clamp(minutes, 10, 24 * 60);
        }

        // Public URL of the web app: App:PublicUrl, else the first allowed CORS origin (the frontend's own origin).
        private string? GetPublicBaseUrl()
        {
            var candidate = _configuration["App:PublicUrl"];
            if (string.IsNullOrWhiteSpace(candidate))
            {
                candidate = (_configuration["Cors:AllowedOrigins"] ?? string.Empty)
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .FirstOrDefault();
            }

            if (string.IsNullOrWhiteSpace(candidate)) return null;
            if (!Uri.TryCreate(candidate.Trim(), UriKind.Absolute, out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
                return null;

            return uri.GetLeftPart(UriPartial.Authority);
        }

        private static void ValidatePassword(string? password, string? email)
        {
            if (string.IsNullOrEmpty(password) || password.Length < 8 || password.Length > 128)
                throw new AppException("WEAK_PASSWORD", "Password must be between 8 and 128 characters.");
            if (!string.IsNullOrEmpty(email) && string.Equals(password, email, StringComparison.OrdinalIgnoreCase))
                throw new AppException("WEAK_PASSWORD", "Password must not be the same as your email.");
        }

        private void NotifyChanged(User user)
        {
            if (string.IsNullOrEmpty(user.Email)) return;
            Dispatch(user.Email, EmailTemplates.PasswordChanged(user.FullName));
        }

        // Sent in the background so the response time does not reveal whether an address has an account.
        // A fresh DI scope is used because the request's scope is disposed when the response completes.
        private void Dispatch(string to, EmailTemplates.EmailContent content)
        {
            var scopeFactory = _scopeFactory;
            var logger = _logger;
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = scopeFactory.CreateScope();
                    var email = scope.ServiceProvider.GetRequiredService<IEmailService>();
                    await email.SendEmailAsync(to, content.Subject, content.Html);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Sending a password email failed.");
                }
            });
        }
    }
}
