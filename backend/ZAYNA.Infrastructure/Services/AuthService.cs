using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Zayna.Core.DTOs;
using Zayna.Core.Exceptions;
using Zayna.Core.Interfaces;
using ZAYNA.Core.Enums;
using ZAYNA.Infrastructure.Data;

namespace Zayna.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly IRepository<User> _userRepository;
        private readonly IOtpService _otpService;
        private readonly IConfiguration _configuration;
        private readonly IGoogleTokenVerifier _googleVerifier;
        private readonly ApplicationDbContext _context;
        private readonly IMemoryCache _cache;

        private const int BcryptWorkFactor = 12;
        private const int MaxFailedLogins = 5;
        private static readonly TimeSpan LockoutWindow = TimeSpan.FromMinutes(15);

        // Verified against when the email is unknown, so response time does not reveal which emails exist.
        private static readonly string DummyHash =
            BCrypt.Net.BCrypt.EnhancedHashPassword("not-a-real-password-timing-equaliser", BcryptWorkFactor);

        public AuthService(
            IRepository<User> userRepository,
            IOtpService otpService,
            IConfiguration configuration,
            IGoogleTokenVerifier googleVerifier,
            ApplicationDbContext context,
            IMemoryCache cache)
        {
            _userRepository = userRepository;
            _otpService = otpService;
            _configuration = configuration;
            _googleVerifier = googleVerifier;
            _context = context;
            _cache = cache;
        }

        // =========================================================
        // GOOGLE SIGN-IN (primary MVP login method)
        // =========================================================
        public async Task<AuthResponseDto> LoginWithGoogleAsync(string idToken)
        {
            var identity = await _googleVerifier.VerifyAsync(idToken);
            if (identity == null)
                throw new AppException("GOOGLE_TOKEN_INVALID", "Google sign-in could not be verified. Please try again.");

            if (!identity.EmailVerified || string.IsNullOrWhiteSpace(identity.Email))
                throw new AppException("GOOGLE_EMAIL_UNVERIFIED", "Your Google account email must be verified.");

            var email = identity.Email.Trim().ToLowerInvariant();

            // 1. Returning Google user
            var user = await _context.Users
                .Include(u => u.SocialAuthProviders)
                .FirstOrDefaultAsync(u => u.SocialAuthProviders.Any(p =>
                    p.Provider == SocialProvider.Google && p.ProviderUserId == identity.Subject));

            if (user == null)
            {
                // 2. Existing account with the same email (e.g. the bootstrap admin or seeded demo user).
                //    Only link when that account's email is already verified, so nobody can pre-register
                //    someone else's address and capture their later Google sign-in.
                user = await _context.Users
                    .Include(u => u.SocialAuthProviders)
                    .FirstOrDefaultAsync(u => u.Email == email);

                if (user != null)
                {
                    if (!user.IsEmailVerified)
                    {
                        // Nobody ever proved ownership of this address (email/password sign-up sends no
                        // verification email). Google just did, so claim the account and discard any old
                        // password: whoever pre-registered this address loses access. Accounts whose phone
                        // was verified are left alone and need support.
                        if (user.IsPhoneVerified)
                            throw new AppException("EMAIL_IN_USE", "This email is already registered. Please contact support.");

                        user.IsEmailVerified = true;
                        user.PasswordHash = null;
                    }

                    user.SocialAuthProviders.Add(new SocialAuthProvider
                    {
                        Provider = SocialProvider.Google,
                        ProviderUserId = identity.Subject,
                        Email = email
                    });
                }
                else
                {
                    // 3. Brand-new user: always a Customer. Salon owners upgrade via RegisterSalonAsync.
                    var fullName = string.IsNullOrWhiteSpace(identity.Name) ? email : identity.Name.Trim();
                    if (fullName.Length > 100) fullName = fullName[..100];

                    user = new User
                    {
                        Email = email,
                        FullName = fullName,
                        Role = UserRole.Customer,
                        IsEmailVerified = true,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    user.Customer = new Customer { User = user, FullName = fullName };
                    user.SocialAuthProviders.Add(new SocialAuthProvider
                    {
                        Provider = SocialProvider.Google,
                        ProviderUserId = identity.Subject,
                        Email = email
                    });
                    _context.Users.Add(user);
                }
            }

            if (!user.IsActive)
                throw new AppException("USER_DISABLED", "This account has been disabled.");

            // A user created by an admin/seed may lack a customer profile; ensure Customers have one.
            if (user.Role == UserRole.Customer && !await _context.Customers.AnyAsync(c => c.UserId == user.Id) && user.Customer == null)
            {
                user.Customer = new Customer { User = user, FullName = user.FullName };
            }

            await _context.SaveChangesAsync();

            return await BuildResponseAsync(user);
        }

        // =========================================================
        // EMAIL + PASSWORD
        // =========================================================
        public async Task<AuthResponseDto> RegisterWithEmailAsync(EmailRegisterDto dto)
        {
            var email = NormalizeEmail(dto.Email);
            var fullName = dto.FullName?.Trim() ?? "";
            if (fullName.Length is < 2 or > 100)
                throw new AppException("VALIDATION_FAILED", "Please enter your full name (2-100 characters).");

            ValidatePassword(dto.Password, email);

            // The role is an untrusted request. Only Customer and Salon may self-register: Admin is bootstrapped
            // from configuration and Stylists are added by their salon owner.
            var role = dto.Role ?? UserRole.Customer;
            if (role != UserRole.Customer && role != UserRole.Salon)
                throw new AppException("ROLE_NOT_ALLOWED", "This account type cannot be created through registration.");

            Salon? salon = null;
            if (role == UserRole.Salon)
                salon = BuildSalon(dto.Salon, email); // validates salon details before any database work

            if (await _context.Users.AnyAsync(u => u.Email == email))
                throw new AppException("EMAIL_IN_USE",
                    "An account with this email already exists. Sign in instead, or use Google sign-in.");

            var user = new User
            {
                Email = email,
                FullName = fullName,
                Role = role,
                PasswordHash = BCrypt.Net.BCrypt.EnhancedHashPassword(dto.Password, BcryptWorkFactor),
                // No verification email is sent (no email provider is configured), so the address is
                // NOT marked verified. Google sign-in with the same address can later claim the account.
                IsEmailVerified = false,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            if (salon != null)
                user.Salon = salon;                                  // user + salon + branch saved atomically below
            else
                user.Customer = new Customer { User = user, FullName = fullName };
            _context.Users.Add(user);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Lost a race with a simultaneous registration of the same email (unique index).
                throw new AppException("EMAIL_IN_USE",
                    "An account with this email already exists. Sign in instead, or use Google sign-in.");
            }

            return await BuildResponseAsync(user);
        }

        public async Task<AuthResponseDto> LoginWithEmailAsync(EmailLoginDto dto)
        {
            var email = (dto.Email ?? "").Trim().ToLowerInvariant();
            var password = dto.Password ?? "";

            if (email.Length == 0 || email.Length > 256 || password.Length == 0 || password.Length > 128)
                throw InvalidCredentials();

            var failKey = $"login-fail:{email}";
            if (_cache.TryGetValue(failKey, out int failures) && failures >= MaxFailedLogins)
                throw new AppException("TOO_MANY_ATTEMPTS",
                    "Too many failed sign-in attempts. Please wait 15 minutes and try again, or use Google sign-in.");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

            // Admins must use Google sign-in; accounts without a password (Google/phone only) cannot use this path.
            var hash = user is { Role: not UserRole.Admin } ? user.PasswordHash : null;

            // Always run one bcrypt verification so timing does not reveal whether the account exists.
            var valid = BCrypt.Net.BCrypt.EnhancedVerify(password, hash ?? DummyHash) && hash != null;
            if (!valid || user == null)
            {
                _cache.Set(failKey, failures + 1, LockoutWindow);
                throw InvalidCredentials();
            }

            if (!user.IsActive)
                throw new AppException("USER_DISABLED", "This account has been disabled.");

            _cache.Remove(failKey);
            return await BuildResponseAsync(user);
        }

        private static AppException InvalidCredentials() =>
            new("INVALID_CREDENTIALS", "Invalid email or password.");

        private static string NormalizeEmail(string? raw)
        {
            var email = (raw ?? "").Trim().ToLowerInvariant();
            var invalid = new AppException("VALIDATION_FAILED", "Please enter a valid email address.");
            if (email.Length == 0 || email.Length > 256) throw invalid;
            try
            {
                if (new System.Net.Mail.MailAddress(email).Address != email) throw invalid;
            }
            catch (FormatException)
            {
                throw invalid;
            }
            return email;
        }

        private static void ValidatePassword(string? password, string email)
        {
            if (string.IsNullOrEmpty(password) || password.Length < 8 || password.Length > 128)
                throw new AppException("WEAK_PASSWORD", "Password must be between 8 and 128 characters.");
            if (string.Equals(password, email, StringComparison.OrdinalIgnoreCase))
                throw new AppException("WEAK_PASSWORD", "Password must not be the same as your email.");
        }

        // =========================================================
        // SALON ONBOARDING (customer -> salon owner, pending admin approval)
        // =========================================================
        public async Task<AuthResponseDto> RegisterSalonAsync(Guid userId, RegisterSalonDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null || !user.IsActive)
                throw new AppException("USER_NOT_FOUND", "User not found");

            if (user.Role != UserRole.Customer)
                throw new AppException("ROLE_NOT_ALLOWED", "Only customer accounts can be upgraded to a salon account.");

            if (await _context.Salons.AnyAsync(s => s.UserId == userId))
                throw new AppException("SALON_EXISTS", "A salon is already registered for this account.");

            var salon = BuildSalon(dto, user.Email);
            salon.UserId = userId;

            user.Role = UserRole.Salon;
            user.UpdatedAt = DateTime.UtcNow;

            _context.Salons.Add(salon); // salon + branch + working hours + role change: one SaveChanges = one transaction
            await _context.SaveChangesAsync();

            return await BuildResponseAsync(user);
        }

        /// <summary>
        /// Validates the salon details and builds an UNVERIFIED salon (hidden from the public until an admin
        /// approves it) with a main branch and default working hours (Friday closed; editable later).
        /// </summary>
        private static Salon BuildSalon(RegisterSalonDto? dto, string? contactEmail)
        {
            var salonName = dto?.SalonName?.Trim() ?? "";
            var phone = dto?.ContactPhone?.Trim() ?? "";
            var city = dto?.City?.Trim() ?? "";
            var address = dto?.AddressLine?.Trim() ?? "";

            if (salonName.Length is < 2 or > 100 ||
                phone.Length is < 6 or > 20 ||
                city.Length is < 2 or > 100 ||
                address.Length is < 2 or > 200)
            {
                throw new AppException("VALIDATION_FAILED",
                    "Salon name, contact phone, city and address are required and must be a reasonable length.");
            }

            var now = DateTime.UtcNow;
            var salon = new Salon
            {
                SalonName = salonName,
                SalonNameAr = string.IsNullOrWhiteSpace(dto!.SalonNameAr) ? null : dto.SalonNameAr.Trim(),
                ContactPhone = phone,
                ContactEmail = contactEmail,
                IsVerified = false,
                CreatedAt = now,
                UpdatedAt = now
            };

            var branch = new Branch
            {
                Salon = salon,
                BranchName = "Main Branch",
                BranchNameAr = "الفرع الرئيسي",
                AddressLine = address,
                City = city,
                PhoneNumber = phone,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            };

            for (int day = 0; day <= 6; day++)
            {
                branch.WorkingHours.Add(new BranchWorkingHours
                {
                    DayOfWeek = (System.DayOfWeek)day,
                    OpenTime = TimeSpan.FromHours(9),
                    CloseTime = TimeSpan.FromHours(21),
                    IsClosed = day == 5
                });
            }

            salon.Branches.Add(branch);
            return salon;
        }

        // =========================================================
        // LOGIN (Phone + OTP) - dormant until an SMS provider is configured
        // =========================================================
        public async Task<AuthResponseDto> LoginWithPhoneAsync(string phoneNumber, string otpCode, UserLanguage userLanguage)
        {
            var otpValid = await _otpService.VerifyOtpAsync(phoneNumber, otpCode, OTPPurpose.Login, userLanguage);
            if (!otpValid)
                throw new AppException("OTP_INVALID", "Invalid or expired OTP");

            var user = await _userRepository.FirstOrDefaultAsync(u => u.PhoneNumber == phoneNumber);
            if (user == null)
                throw new AppException("USER_NOT_FOUND", "User not found");

            if (!user.IsActive)
                throw new AppException("USER_DISABLED", "This account has been disabled.");

            if (!user.IsPhoneVerified)
            {
                user.IsPhoneVerified = true;
                await _userRepository.UpdateAsync(user);
            }

            return await BuildResponseAsync(user);
        }

        // =========================================================
        // REGISTER (Phone + OTP) - dormant until an SMS provider is configured
        // =========================================================
        public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
        {
            var otpValid = await _otpService.VerifyOtpAsync(dto.PhoneNumber, dto.OtpCode, OTPPurpose.Registration, dto.UserLanguage);
            if (!otpValid)
                throw new AppException("OTP_INVALID", "Invalid or expired OTP");

            var exists = await _userRepository.FirstOrDefaultAsync(u => u.PhoneNumber == dto.PhoneNumber);
            if (exists != null)
                throw new AppException("USER_EXISTS", "User already exists");

            var email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim().ToLowerInvariant();
            if (email != null && await _userRepository.ExistsAsync(u => u.Email == email))
                throw new AppException("EMAIL_IN_USE", "This email is already registered.");

            var user = new User
            {
                PhoneNumber = dto.PhoneNumber,
                FullName = dto.FullName,
                Email = email,
                Role = UserRole.Customer,
                IsPhoneVerified = true,
                CreatedAt = DateTime.UtcNow
            };
            user.Customer = new Customer { User = user, FullName = user.FullName };

            await _userRepository.AddAsync(user);
            return await BuildResponseAsync(user);
        }

        // =========================================================
        // JWT
        // =========================================================
        public async Task<string> GenerateTokenAsync(Guid userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new AppException("USER_NOT_FOUND", "User not found");

            return CreateJwt(user);
        }

        public Task<bool> ValidateTokenAsync(string token)
        {
            var handler = new JwtSecurityTokenHandler();
            return Task.FromResult(handler.CanReadToken(token));
        }

        private Task<AuthResponseDto> BuildResponseAsync(User user)
        {
            return Task.FromResult(new AuthResponseDto
            {
                UserId = user.Id,
                Token = CreateJwt(user),
                Role = user.Role,
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
                PhoneNumber = user.PhoneNumber ?? string.Empty
            });
        }

        private string CreateJwt(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(int.Parse(jwtSettings["ExpiryHours"]!)),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
