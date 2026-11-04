# Multi-stage .NET 8 build for the ZAYNA API (build context: ./backend)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restore first, from the project files only, so this layer is cached until a dependency changes.
COPY ZAYNA.API/ZAYNA.API.csproj ZAYNA.API/
COPY ZAYNA.Core/ZAYNA.Core.csproj ZAYNA.Core/
COPY ZAYNA.Infrastructure/ZAYNA.Infrastructure.csproj ZAYNA.Infrastructure/
COPY ZAYNA.Application/ZAYNA.Application.csproj ZAYNA.Application/
RUN dotnet restore ZAYNA.API/ZAYNA.API.csproj

COPY . .
RUN dotnet publish ZAYNA.API/ZAYNA.API.csproj -c Release -o /app/publish --no-restore /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# curl is only used by the container health check.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish .

# Run as the unprivileged "app" user that ships with the .NET 8 images (never as root).
USER app
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
    CMD curl -fsS http://localhost:8080/health/live || exit 1

# Maintenance commands are passed as arguments:  docker compose run --rm api --pending | --migrate
ENTRYPOINT ["dotnet", "ZAYNA.API.dll"]
