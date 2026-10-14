using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourIraq.Api.Data;
using TourIraq.Api.DTOs;
using TourIraq.Api.Models;
using TourIraq.Api.Services;

namespace TourIraq.Api.Controllers;

[ApiController]
[Route("api/stamps")]
[Authorize(Roles = "Tourist")]
public class StampsController(AppDbContext db, GeoService geo, FileStorageService files, RewardService rewards) : ControllerBase
{
    [HttpPost]
    [RequestSizeLimit(6_000_000)]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<StampResponse>> Create([FromForm] CreateStampRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId()!.Value;
        var lat = req.Lat!.Value;
        var lng = req.Lng!.Value;

        if (!GeoService.IsValidCoordinate(lat, lng))
            return Problem(statusCode: 400, title: "Invalid coordinates", detail: "Latitude must be -90..90 and longitude -180..180.");

        var place = await db.Places.AsNoTracking().FirstOrDefaultAsync(p => p.Id == req.PlaceId, ct);
        if (place is null) return Problem(statusCode: 404, title: "Place not found");

        // The server uses ITS OWN place coordinates; the client only sends the tourist's position.
        var distance = geo.DistanceMeters(lat, lng, place.Latitude, place.Longitude);
        if (distance > place.StampRadiusMeters)
        {
            var problem = new ProblemDetails
            {
                Status = 400, Title = "Too far from the place",
                Detail = $"You are about {Math.Round(distance)} m away. You must be within {place.StampRadiusMeters} m to collect this stamp."
            };
            problem.Extensions["distanceMeters"] = Math.Round(distance, 1);
            problem.Extensions["allowedRadiusMeters"] = place.StampRadiusMeters;
            return StatusCode(400, problem);
        }

        if (await db.Stamps.AnyAsync(s => s.UserId == userId && s.PlaceId == place.Id, ct))
            return Problem(statusCode: 409, title: "Stamp already collected", detail: "You already have a stamp for this place.");

        var (url, error) = await files.SaveImageAsync(req.Photo, ct);
        if (url is null) return Problem(statusCode: 400, title: "Invalid photo", detail: error);

        try
        {
            var before = await db.Stamps.CountAsync(s => s.UserId == userId, ct);

            var stamp = new Stamp
            {
                UserId = userId, PlaceId = place.Id, PhotoUrl = url,
                Latitude = lat, Longitude = lng, DistanceFromPlaceMeters = Math.Round(distance, 1),
                CreatedAt = DateTime.UtcNow
            };
            db.Stamps.Add(stamp);
            await db.SaveChangesAsync(ct);

            var after = await db.Stamps.CountAsync(s => s.UserId == userId, ct);
            var unlocked = await rewards.GetNewlyUnlockedAsync(before, after, ct);

            return StatusCode(201, new StampResponse
            {
                StampId = stamp.Id, PlaceId = place.Id, PlaceName = place.Name, PhotoUrl = url,
                DistanceMeters = stamp.DistanceFromPlaceMeters, TotalStamps = after, NewlyUnlockedRewards = unlocked
            });
        }
        catch (DbUpdateException)
        {
            // The unique (UserId, PlaceId) index caught a concurrent duplicate: remove the saved photo.
            files.Delete(url);
            return Problem(statusCode: 409, title: "Stamp already collected", detail: "You already have a stamp for this place.");
        }
        catch
        {
            files.Delete(url); // never leave orphan files when saving the record fails
            throw;
        }
    }
}
