using System.Data;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourIraq.Api.Data;
using TourIraq.Api.DTOs;
using TourIraq.Api.Models;

namespace TourIraq.Api.Controllers;

[ApiController]
[Route("api/admin-setup")]
public class AdminSetupController(AppDbContext db, IConfiguration configuration) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("status")]
    public async Task<ActionResult<object>> GetStatus(CancellationToken ct)
    {
        var setupToken = configuration["AdminSetup:Token"];
        var hasAdmin = await db.Users.AnyAsync(user => user.Role == UserRole.Admin, ct);
        return Ok(new { available = !hasAdmin && !string.IsNullOrWhiteSpace(setupToken) });
    }

    [AllowAnonymous]
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult> CreateFirstAdmin(FirstAdminSetupRequest request, CancellationToken ct)
    {
        var configuredToken = configuration["AdminSetup:Token"];
        if (string.IsNullOrWhiteSpace(configuredToken))
            return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "Admin setup is disabled");

        var submittedToken = Encoding.UTF8.GetBytes(request.SetupToken);
        var expectedToken = Encoding.UTF8.GetBytes(configuredToken);
        if (!CryptographicOperations.FixedTimeEquals(submittedToken, expectedToken))
            return Problem(statusCode: StatusCodes.Status403Forbidden, title: "Invalid setup token");

        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        if (await db.Users.AnyAsync(user => user.Role == UserRole.Admin, ct))
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "An administrator already exists");

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Admin,
            Gender = Gender.Male,
            Country = "Iraq",
            PreferredLanguage = "Arabic",
            IsVerified = true,
            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(user);
        try
        {
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync(ct);
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "An administrator already exists or this email is in use");
        }

        return CreatedAtAction(nameof(GetStatus), new { available = false }, new { user.Id, user.Email });
    }
}