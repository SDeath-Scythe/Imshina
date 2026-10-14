using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourIraq.Api.Data;
using TourIraq.Api.DTOs;
using TourIraq.Api.Services;

namespace TourIraq.Api.Controllers;

[ApiController]
[Route("api/passport")]
[Authorize(Roles = "Tourist")]
public class PassportController(AppDbContext db) : ControllerBase
{
    [HttpGet("me")]
    public async Task<ActionResult<PassportDto>> Me(CancellationToken ct)
    {
        var userId = User.GetUserId()!.Value;

        var stamps = await db.Stamps.AsNoTracking()
            .Where(s => s.UserId == userId)
            .Include(s => s.Place).ThenInclude(p => p.Governorate)
            .ToListAsync(ct);

        return Ok(new PassportDto
        {
            TotalStamps = stamps.Count,
            Stamps = stamps.OrderByDescending(s => s.CreatedAt).Select(s => new PassportStampDto
            {
                StampId = s.Id, PlaceId = s.PlaceId, PlaceName = s.Place.Name, PlaceNameAr = s.Place.NameAr,
                GovernorateName = s.Place.Governorate.Name, PhotoUrl = s.PhotoUrl,
                DistanceMeters = s.DistanceFromPlaceMeters, CreatedAt = s.CreatedAt
            }).ToList()
        });
    }
}
