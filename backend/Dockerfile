<<<<<<< HEAD
# ============================================
# Backend/Dockerfile
# ============================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files
COPY Zayna.API/Zayna.API.csproj Zayna.API/
COPY Zayna.Core/Zayna.Core.csproj Zayna.Core/
COPY Zayna.Infrastructure/Zayna.Infrastructure.csproj Zayna.Infrastructure/

# Restore dependencies
RUN dotnet restore Zayna.API/Zayna.API.csproj

# Copy everything else
COPY . .

# Build
WORKDIR /src/Zayna.API
RUN dotnet build -c Release -o /app/build

# Publish
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=publish /app/publish .
=======
# ============================================
# Backend/Dockerfile
# ============================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files
COPY Zayna.API/Zayna.API.csproj Zayna.API/
COPY Zayna.Core/Zayna.Core.csproj Zayna.Core/
COPY Zayna.Infrastructure/Zayna.Infrastructure.csproj Zayna.Infrastructure/

# Restore dependencies
RUN dotnet restore Zayna.API/Zayna.API.csproj

# Copy everything else
COPY . .

# Build
WORKDIR /src/Zayna.API
RUN dotnet build -c Release -o /app/build

# Publish
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=publish /app/publish .
>>>>>>> ad1c20bbfa5fae845c4a70a80e033b30b71be9d7
ENTRYPOINT ["dotnet", "Zayna.API.dll"]