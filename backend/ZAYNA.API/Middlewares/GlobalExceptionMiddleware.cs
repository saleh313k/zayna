<<<<<<< HEAD
﻿using Zayna.Core.Exceptions;

namespace ZAYNA.API.Middlewares
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;

        public GlobalExceptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (AppException ex)
            {
                context.Response.StatusCode = 400;
                context.Response.ContentType = "application/json";

                var response = new
                {
                    success = false,
                    code = ex.Code,
                    message = ex.Message
                };

                await context.Response.WriteAsJsonAsync(response);
            }
            catch (Exception e)
            {
                context.Response.StatusCode = 500;
                context.Response.ContentType = "application/json";

                var response = new
                {
                    success = false,
                    code = "SERVER_ERROR",
                    message = "Internal server error",
                    exception = e.ToString()
                };

                await context.Response.WriteAsJsonAsync(response);
            }
        }
    }
}
=======
﻿using Zayna.Core.Exceptions;

namespace ZAYNA.API.Middlewares
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;

        public GlobalExceptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (AppException ex)
            {
                context.Response.StatusCode = 400;
                context.Response.ContentType = "application/json";

                var response = new
                {
                    success = false,
                    code = ex.Code,
                    message = ex.Message
                };

                await context.Response.WriteAsJsonAsync(response);
            }
            catch (Exception e)
            {
                context.Response.StatusCode = 500;
                context.Response.ContentType = "application/json";

                var response = new
                {
                    success = false,
                    code = "SERVER_ERROR",
                    message = "Internal server error",
                    exception = e.ToString()
                };

                await context.Response.WriteAsJsonAsync(response);
            }
        }
    }
}
>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7
