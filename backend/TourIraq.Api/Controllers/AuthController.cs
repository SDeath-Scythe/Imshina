using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourIraq.Api.Data;
using TourIraq.Api.DTOs;
using TourIraq.Api.Models;
using TourIraq.Api.Services;

namespace TourIraq.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, JwtService jwt) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest req, CancellationToken ct)
    {
        // Only Tourist and Guide may self-register. Agency/Admin are never created here.
        if (req.Role != UserRole.Tourist && req.Role != UserRole.Guide)
            return Problem(statusCode: 400, title: "Invalid role", detail: "Registration is only available for Tourist or Guide accounts.");

        var email = req.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email, ct))
            return Problem(statusCode: 409, title: "Email already registered", detail: "An account with this email already exists.");

        var user = new User
        {
            FullName = req.FullName.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = req.Role!.Value,
            Gender = req.Gender!.Value,
            Country = req.Country.Trim(),
            PreferredLanguage = string.IsNullOrWhiteSpace(req.PreferredLanguage) ? "English" : req.PreferredLanguage.Trim(),
            IsVerified = false,
            CreatedAt = DateTime.UtcNow
        };

        if (user.Role == UserRole.Guide)
        {
            if (req.PricePerDay is < 0 or > 10000)
                return Problem(statusCode: 400, title: "Invalid price", detail: "Price per day must be between 0 and 10000.");

            var profile = new GuideProfile
            {
                Bio = req.Bio?.Trim() ?? string.Empty,
                PricePerDay = Math.Round(req.PricePerDay ?? 50m, 2)
            };
            var languages = (req.Languages ?? new List<string>())
                .Select(l => l.Trim()).Where(l => l.Length is > 0 and <= 40)
                .Distinct(StringComparer.OrdinalIgnoreCase).Take(10).ToList();
            if (languages.Count == 0) languages.Add(user.PreferredLanguage);
            foreach (var l in languages) profile.Languages.Add(new GuideLanguage { Language = l });
            user.GuideProfile = profile;
        }

        db.Users.Add(user);
        try
        {
            await db.SaveChangesAsync(ct); // single save = one transaction (user + profile)
        }
        catch (DbUpdateException)
        {
            return Problem(statusCode: 409, title: "Email already registered", detail: "An account with this email already exists.");
        }

        var (token, expires) = jwt.CreateToken(user);
        return StatusCode(201, new AuthResponse { Token = token, ExpiresAt = expires, User = ToDto(user) });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req, CancellationToken ct)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        // Same message for unknown email and wrong password.
        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Problem(statusCode: 401, title: "Invalid credentials", detail: "Email or password is incorrect.");

        var (token, expires) = jwt.CreateToken(user);
        return Ok(new AuthResponse { Token = token, ExpiresAt = expires, User = ToDto(user) });
    }

    private static UserDto ToDto(User u) => new()
    {
        Id = u.Id, FullName = u.FullName, Email = u.Email, Role = u.Role.ToString(),
        Gender = u.Gender.ToString(), Country = u.Country, PreferredLanguage = u.PreferredLanguage
    };
}
