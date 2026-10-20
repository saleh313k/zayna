# Multi-stage .NET 8 build for the ZAYNA API
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ZAYNA.API/ZAYNA.API.csproj ZAYNA.API/
COPY ZAYNA.Core/ZAYNA.Core.csproj ZAYNA.Core/
COPY ZAYNA.Infrastructure/ZAYNA.Infrastructure.csproj ZAYNA.Infrastructure/
COPY ZAYNA.Application/ZAYNA.Application.csproj ZAYNA.Application/
RUN dotnet restore ZAYNA.API/ZAYNA.API.csproj

COPY . .
RUN dotnet publish ZAYNA.API/ZAYNA.API.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ZAYNA.API.dll"]
