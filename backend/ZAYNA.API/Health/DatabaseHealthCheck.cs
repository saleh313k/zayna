using Microsoft.Extensions.Diagnostics.HealthChecks;
using ZAYNA.Infrastructure.Data;

namespace ZAYNA.API.Health
{
    /// <summary>
    /// Readiness probe: the API can reach its database. Used by /health/ready (Docker health check, uptime monitors).
    /// Failure details are logged by the health-check system, never returned to the caller.
    /// </summary>
    public class DatabaseHealthCheck : IHealthCheck
    {
        private readonly ApplicationDbContext _context;

        public DatabaseHealthCheck(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context, CancellationToken cancellationToken = default)
        {
            try
            {
                return await _context.Database.CanConnectAsync(cancellationToken)
                    ? HealthCheckResult.Healthy()
                    : HealthCheckResult.Unhealthy("Database is not reachable.");
            }
            catch (Exception ex)
            {
                return HealthCheckResult.Unhealthy("Database check failed.", ex);
            }
        }
    }
}
