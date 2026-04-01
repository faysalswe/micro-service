FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 5010

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["services/IdentityService/IdentityService.csproj", "services/IdentityService/"]
RUN dotnet restore "services/IdentityService/IdentityService.csproj"
COPY . .
WORKDIR "/src/services/IdentityService"
RUN dotnet build "IdentityService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "IdentityService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app

# Create non-root user
RUN useradd --create-home --uid 1001 appuser && \
    chown -R appuser:appuser /app

COPY --from=publish --chown=appuser:appuser /app/publish .
USER 1001

# Set Kestrel endpoint configuration
ENV Kestrel__Endpoints__Http__Url=http://+:5010
ENV Kestrel__Endpoints__Http__Protocols=Http1

ENTRYPOINT ["dotnet", "IdentityService.dll"]
