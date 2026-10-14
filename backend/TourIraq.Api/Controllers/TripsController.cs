using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourIraq.Api.Data;
using TourIraq.Api.DTOs;
using TourIraq.Api.Models;
using TourIraq.Api.Services;

namespace TourIraq.Api.Controllers;

[ApiController]
[Route("api/trips")]
public class TripsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<TripDto>>> GetReadyMade(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10, CancellationToken ct = default)
    {
        (page, pageSize) = Paging.Clamp(page, pageSize);
        var query = db.Trips.AsNoTracking().Where(t => t.IsReadyMade);
        var total = await query.CountAsync(ct);

        var trips = await query.OrderBy(t => t.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Include(t => t.TripPlaces).ThenInclude(tp => tp.Place)
            .AsSplitQuery()
            .ToListAsync(ct);

        return Ok(new PagedResult<TripDto> { Items = trips.Select(ToDto).ToList(), Page = page, PageSize = pageSize, TotalCount = total });
    }

    // Convenience endpoint: a tourist's own custom itineraries.
    [HttpGet("mine")]
    [Authorize(Roles = "Tourist")]
    public async Task<ActionResult<List<TripDto>>> Mine(CancellationToken ct)
    {
        var userId = User.GetUserId()!.Value;
        var trips = await db.Trips.AsNoTracking()
            .Where(t => !t.IsReadyMade && t.OwnerId == userId)
            .Include(t => t.TripPlaces).ThenInclude(tp => tp.Place)
            .AsSplitQuery()
            .ToListAsync(ct);
        return Ok(trips.OrderByDescending(t => t.CreatedAt).Select(ToDto).ToList());
    }

    [HttpPost("custom")]
    [Authorize(Roles = "Tourist")]
    public async Task<ActionResult<TripDto>> CreateCustom(CreateCustomTripRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId()!.Value;

        var dayNumbers = req.Days.Select(d => d.DayNumber).ToList();
        if (dayNumbers.Distinct().Count() != dayNumbers.Count)
            return Problem(statusCode: 400, title: "Invalid itinerary", detail: "Each day number may appear only once.");

        var allPlaceIds = req.Days.SelectMany(d => d.PlaceIds).ToList();
        if (allPlaceIds.Distinct().Count() != allPlaceIds.Count)
            return Problem(statusCode: 400, title: "Invalid itinerary", detail: "A place can only appear once in an itinerary.");

        var existing = await db.Places.Where(p => allPlaceIds.Contains(p.Id)).Select(p => p.Id).ToListAsync(ct);
        var missing = allPlaceIds.Except(existing).ToList();
        if (missing.Count > 0)
            return Problem(statusCode: 400, title: "Unknown places", detail: $"Place ids not found: {string.Join(", ", missing)}.");

        var trip = new Trip
        {
            Title = req.Title.Trim(), Description = (req.Description ?? string.Empty).Trim(),
            DurationDays = dayNumbers.Max(), Price = 0m, IsReadyMade = false,
            OwnerId = userId, CreatedAt = DateTime.UtcNow
        };

        foreach (var day in req.Days.OrderBy(d => d.DayNumber))
            for (var i = 0; i < day.PlaceIds.Count; i++)
                trip.TripPlaces.Add(new TripPlace { PlaceId = day.PlaceIds[i], DayNumber = day.DayNumber, OrderInDay = i + 1 });

        db.Trips.Add(trip);
        await db.SaveChangesAsync(ct); // trip + places saved atomically

        var saved = await db.Trips.AsNoTracking()
            .Include(t => t.TripPlaces).ThenInclude(tp => tp.Place)
            .FirstAsync(t => t.Id == trip.Id, ct);
        return StatusCode(201, ToDto(saved));
    }

    private static TripDto ToDto(Trip t) => new()
    {
        Id = t.Id, Title = t.Title, Description = t.Description, DurationDays = t.DurationDays,
        Price = t.Price, CoverImageUrl = t.CoverImageUrl, IsReadyMade = t.IsReadyMade,
        Days = t.TripPlaces.GroupBy(tp => tp.DayNumber).OrderBy(g => g.Key)
            .Select(g => new TripDayDto
            {
                DayNumber = g.Key,
                Places = g.OrderBy(tp => tp.OrderInDay).Select(tp => new TripPlaceDto
                {
                    PlaceId = tp.PlaceId, Name = tp.Place.Name, NameAr = tp.Place.NameAr,
                    OrderInDay = tp.OrderInDay, Latitude = tp.Place.Latitude, Longitude = tp.Place.Longitude
                }).ToList()
            }).ToList()
    };
}
