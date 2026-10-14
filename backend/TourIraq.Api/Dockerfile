# Imshina API. Build from this folder:  docker build -t imshina-api .
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY TourIraq.Api.csproj ./
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /out --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /out ./

# Everything that must survive a restart lives under /data: the SQLite database and the
# uploaded stamp photos (served from the web root). Mount a persistent disk at /data in production.
ENV ASPNETCORE_HTTP_PORTS=8080 \
    ASPNETCORE_WEBROOT=/data/wwwroot \
    ConnectionStrings__DefaultConnection="Data Source=/data/touriraq.db"

EXPOSE 8080
# The folder is created at start-up, after any disk is mounted: if the web root is missing when the
# app starts, ASP.NET serves no static files at all, so stamp photos would 404.
ENTRYPOINT ["sh", "-c", "mkdir -p /data/wwwroot/uploads && exec dotnet TourIraq.Api.dll"]
