using Zayna.Core.Exceptions;

namespace ZAYNA.API.Middlewares
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (AppException ex)
            {
                _logger.LogWarning("Application error {ErrorCode} for {Method} {Path}. TraceId: {TraceId}", ex.Code, context.Request.Method, context.Request.Path, context.TraceIdentifier);
                if (context.Response.HasStarted) throw;
                context.Response.Clear();
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new { success = false, code = ex.Code, message = ex.Message, traceId = context.TraceIdentifier });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception for {Method} {Path}. TraceId: {TraceId}", context.Request.Method, context.Request.Path, context.TraceIdentifier);
                if (context.Response.HasStarted) throw;
                context.Response.Clear();
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new { success = false, code = "SERVER_ERROR", message = "An unexpected error occurred. Please try again later.", traceId = context.TraceIdentifier });
            }
        }
    }
}
