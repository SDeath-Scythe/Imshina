using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TourIraq.Api.Data;
using TourIraq.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// ---- Configuration checks (fail fast, never hard-code secrets) ----
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || Encoding.UTF8.GetByteCount(jwtKey) < 32)
{
    throw new InvalidOperationException(
        "Jwt:Key is missing or shorter than 32 bytes. Set it with: " +
        "dotnet user-secrets set \"Jwt:Key\" \"<long-random-string>\" or the Jwt__Key environment variable.");
}

// ---- Services ----
builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();

builder.Services.AddSingleton<JwtService>();
builder.Services.AddSingleton<GeoService>();
builder.Services.AddScoped<FileStorageService>();
builder.Services.AddScoped<RewardService>();

var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
              ?? new[] { "http://localhost:5173" };
builder.Services.AddCors(o => o.AddPolicy("Frontend", p =>
    p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.MapInboundClaims = false; // keep "sub" and "role" as-is
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidAlgorithms = new[] { SecurityAlgorithms.HmacSha256 },
            NameClaimType = "sub",
            RoleClaimType = "role",
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

// ---- Database: apply migrations, then seed (idempotent) ----
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (!db.Database.GetMigrations().Any())
    {
        throw new InvalidOperationException(
            "No EF Core migrations found. Run once from backend/TourIraq.Api: " +
            "dotnet ef migrations add InitialCreate");
    }
    await db.Database.MigrateAsync();
    if (app.Configuration.GetValue("Seed:Enabled", true))
    {
        await SeedData.InitializeAsync(db);
    }
}

// ---- Pipeline ----
app.UseExceptionHandler();     // safe ProblemDetails, no stack traces
app.UseStatusCodePages();      // ProblemDetails bodies for 401/403/404

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();          // /openapi/v1.json
}

app.UseStaticFiles();          // serves /uploads/*
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
