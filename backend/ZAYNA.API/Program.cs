using System.Threading.RateLimiting;
// ZAYNA.API/Program.cs
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using Zayna.Core.Interfaces;
using Zayna.Infrastructure.Data;
using Zayna.Infrastructure.Services;
using ZAYNA.API.Health;
using ZAYNA.API.Middlewares;
using ZAYNA.Core.Entities;
using ZAYNA.Core.Interfaces;
using ZAYNA.Infrastructure.Data;
using ZAYNA.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Production logs are one JSON object per line on stdout (easy to search with `docker compose logs`).
// Set Logging:JsonConsole=false to get plain text instead.
if (!builder.Environment.IsDevelopment() && builder.Configuration.GetValue("Logging:JsonConsole", true))
{
    builder.Logging.ClearProviders();
    builder.Logging.AddJsonConsole(o =>
    {
        o.IncludeScopes = false;
        o.UseUtcTimestamp = true;
        o.TimestampFormat = "yyyy-MM-ddTHH:mm:ss.fffZ";
    });
}

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

//builder.Services.AddControllersWithViews().AddJsonOptions(options =>
//{
//    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.Preserve;
//});


// Swagger Configuration
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ZAYNA Booking API",
        Version = "v1",
        Description = "Bilingual Salon & Barber Booking System for Oman",
        Contact = new OpenApiContact
        {
            Name = "ZAYNA",
            Email = "support@zayna.om"
        }
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Database configuration: use one canonical key across environments.
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "ConnectionStrings:DefaultConnection must be configured.");
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString, b => b.MigrationsAssembly("ZAYNA.API")));

// JWT configuration: fail at startup rather than signing tokens with a known placeholder.
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var jwtSecret = jwtSettings["SecretKey"];
var jwtIssuer = jwtSettings["Issuer"];
var jwtAudience = jwtSettings["Audience"];
var expiryHoursValue = jwtSettings["ExpiryHours"];

if (string.IsNullOrWhiteSpace(jwtSecret) ||
    jwtSecret.Length < 32 ||
    jwtSecret.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase) ||
    jwtSecret.Contains("CHANGE_THIS", StringComparison.OrdinalIgnoreCase))
{
    throw new InvalidOperationException(
        "JwtSettings:SecretKey must be set to a private, random secret of at least 32 characters.");
}

if (string.IsNullOrWhiteSpace(jwtIssuer) || string.IsNullOrWhiteSpace(jwtAudience))
{
    throw new InvalidOperationException(
        "JwtSettings:Issuer and JwtSettings:Audience must both be configured.");
}

if (!int.TryParse(expiryHoursValue, out var expiryHours) || expiryHours <= 0)
{
    throw new InvalidOperationException(
        "JwtSettings:ExpiryHours must be a positive integer.");
}

var secretKey = Encoding.UTF8.GetBytes(jwtSecret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(secretKey),
        ClockSkew = TimeSpan.Zero
    };

    // A disabled (or deleted) user must lose access immediately, not only when the token expires.
    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async ctx =>
        {
            var idValue = ctx.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                          ?? ctx.Principal?.FindFirst("sub")?.Value;
            if (!Guid.TryParse(idValue, out var userId))
            {
                ctx.Fail("Invalid token subject.");
                return;
            }

            var db = ctx.HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
            var isActive = await db.Users.AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => (bool?)u.IsActive)
                .FirstOrDefaultAsync();

            if (isActive != true)
                ctx.Fail("User is disabled or no longer exists.");
        }
    };
});

// Google Sign-In: the server verifies Google ID tokens against this client id.
var googleClientId = builder.Configuration["GoogleSettings:ClientId"];
if (string.IsNullOrWhiteSpace(googleClientId) ||
    googleClientId.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase))
{
    throw new InvalidOperationException(
        "GoogleSettings:ClientId must be configured (Google Cloud Console > Credentials > OAuth client ID).");
}

// CORS: explicit allow-list from configuration (Cors:AllowedOrigins, comma-separated).
var allowedOrigins = (builder.Configuration["Cors:AllowedOrigins"] ?? string.Empty)
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

if (allowedOrigins.Length == 0 && builder.Environment.IsDevelopment())
{
    allowedOrigins = new[] { "http://localhost:5173", "http://localhost:3000" };
}

if (allowedOrigins.Length == 0)
{
    throw new InvalidOperationException(
        "Cors:AllowedOrigins must list the public frontend origin(s), e.g. https://app.example.com");
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        // Auth uses a bearer token header, not cookies, so credentials are not needed.
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddMemoryCache();

// Booking: salon-local clock (booking dates/times are local wall-clock values) and the configurable rules.
builder.Services.AddSingleton<ISalonClock, SalonClock>();
builder.Services.AddSingleton<BookingPolicy>();

// Brute-force protection for credential endpoints (per client IP). Behind a reverse proxy the proxy's
// forwarded client IP must be trusted (forwarded headers) for this to see real client addresses.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

// Reverse proxy support. ONLY enable (Proxy:TrustForwardedHeaders=true) when the API is reachable exclusively
// through your own reverse proxy (as in docker-compose.prod.yml, where the API port is not published): otherwise a
// client could forge X-Forwarded-For and dodge the login rate limit. With ForwardLimit = 1 only the address appended
// by the proxy is used.
var trustForwardedHeaders = builder.Configuration.GetValue("Proxy:TrustForwardedHeaders", false);
if (trustForwardedHeaders)
{
    builder.Services.Configure<ForwardedHeadersOptions>(o =>
    {
        o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        o.ForwardLimit = 1;
        o.KnownNetworks.Clear();
        o.KnownProxies.Clear();
    });
}

// Health: /health/live = the process answers; /health/ready = it can also reach the database.
builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database", tags: new[] { "ready" });

// Register Services
builder.Services.AddScoped(typeof(IRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IGoogleTokenVerifier, GoogleTokenVerifier>();
builder.Services.AddScoped<ISmsService, TwilioSmsService>();
builder.Services.AddScoped<IEmailService, SendGridEmailService>();
builder.Services.AddScoped<IPaymentService, ThawaniPaymentService>();
builder.Services.AddScoped<ILoyaltyService, LoyaltyService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IOtpService, OtpService>();
builder.Services.AddScoped<PublicSalonService>();


// AutoMapper
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// HttpClient for external APIs
builder.Services.AddHttpClient();

var app = builder.Build();

// Must run before anything that looks at the client address or scheme (rate limiter, logging).
if (trustForwardedHeaders)
{
    app.UseForwardedHeaders();
}

// Must be first so it wraps routing, auth and controllers.
app.UseMiddleware<GlobalExceptionMiddleware>();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ZAYNA API V1");
        c.RoutePrefix = "api/docs";
    });
}

// In Development the SPA calls http://localhost:5000 directly; a 307 redirect to HTTPS would be
// blocked by the browser (redirect responses carry no CORS headers). In production TLS is terminated
// by the reverse proxy / host, so redirecting inside the container is not needed either.
if (app.Environment.IsDevelopment() == false && app.Configuration.GetValue<bool>("EnforceHttpsRedirection"))
{
    app.UseHttpsRedirection();
}
app.UseCors("AllowReactApp");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = check => check.Tags.Contains("ready") });
// ---------------------------------------------------------------------------------------------
// Database migrations
//   Development:  migrated automatically at startup (convenient).
//   Production:   Database:AutoMigrate defaults to FALSE. The API refuses to start on an outdated schema, and you
//                 apply changes deliberately with the maintenance commands below (see docs/DEPLOYMENT.md):
//                   dotnet ZAYNA.API.dll --pending   lists migrations not yet applied; changes nothing
//                   dotnet ZAYNA.API.dll --migrate   applies pending migrations + ensures the admin account, then exits
// ---------------------------------------------------------------------------------------------
var autoMigrate = builder.Configuration.GetValue("Database:AutoMigrate", builder.Environment.IsDevelopment());

if (args.Contains("--pending") || args.Contains("--migrate"))
{
    using var maintenanceScope = app.Services.CreateScope();
    var db = maintenanceScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try
    {
        var applied = (await db.Database.GetAppliedMigrationsAsync()).ToList();
        var pending = (await db.Database.GetPendingMigrationsAsync()).ToList();
        Console.WriteLine($"Applied migrations : {applied.Count}");
        Console.WriteLine(pending.Count == 0
            ? "Pending migrations: none"
            : "Pending migrations:" + Environment.NewLine + "  " + string.Join(Environment.NewLine + "  ", pending));

        if (args.Contains("--migrate"))
        {
            await DbInitializer.Initialize(db, builder.Configuration["Admin:Email"], seedDemoData: false, applyMigrations: true);
            Console.WriteLine("Done: migrations applied and initial data ensured.");
        }
    }
    catch (Exception ex)
    {
        Console.Error.WriteLine("Maintenance command failed: " + ex.Message);
        Environment.ExitCode = 1;
    }
    return;
}

// Normal startup. A failure here must stop startup: running against a missing or outdated schema would only
// fail later, at the user's expense.
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        await DbInitializer.Initialize(
            context,
            builder.Configuration["Admin:Email"],
            seedDemoData: app.Environment.IsDevelopment(),
            applyMigrations: autoMigrate);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogCritical(ex, "Database migration/initialisation failed. Shutting down.");
        throw;
    }
}

app.Run();

