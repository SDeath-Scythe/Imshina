using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourIraq.Api.Data;
using TourIraq.Api.DTOs;
using TourIraq.Api.Models;
using TourIraq.Api.Services;

namespace TourIraq.Api.Controllers;

[ApiController]
[Route("api/admin/places")]
[Authorize(Roles = "Admin")]
public class AdminPlacesController(AppDbContext db, FileStorageService fileStorage) : ControllerBase
{
    [HttpPost]
    [RequestSizeLimit(32_000_000)]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> Create([FromForm] CreatePlaceRequest request, CancellationToken ct)
    {
        if (request.CoverImage is null || request.CoverImage.Length == 0)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "A cover image is required");
        if (request.Images.Count > 5)
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Too many photos", detail: "Upload at most five additional photos.");
        if (!await db.Governorates.AnyAsync(g => g.Id == request.GovernorateId, ct))
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Unknown governorate");
        var name = request.Name.Trim();
        if (await db.Places.AnyAsync(p => p.Name == name, ct))
            return Problem(statusCode: StatusCodes.Status409Conflict, title: "Name already used", detail: "A place with this English name already exists.");

        var savedUrls = new List<string>();
        var (coverUrl, coverError) = await fileStorage.SaveImageAsync(request.CoverImage, ct);
        if (coverError is not null) return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid cover image", detail: coverError);
        savedUrls.Add(coverUrl!);

        var imageUrls = new List<string>();
        foreach (var image in request.Images)
        {
            var (url, error) = await fileStorage.SaveImageAsync(image, ct);
            if (error is not null)
            {
                foreach (var savedUrl in savedUrls) fileStorage.Delete(savedUrl);
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid place image", detail: error);
            }
            imageUrls.Add(url!);
            savedUrls.Add(url!);
        }

        var place = new Place
        {
            GovernorateId = request.GovernorateId!.Value,
            Name = request.Name.Trim(),
            NameAr = request.NameAr.Trim(),
            ShortDescription = request.ShortDescription.Trim(),
            ShortDescriptionAr = request.ShortDescriptionAr.Trim(),
            Description = request.Description.Trim(),
            DescriptionAr = request.DescriptionAr.Trim(),
            Category = request.Category!.Value,
            Latitude = request.Latitude!.Value,
            Longitude = request.Longitude!.Value,
            StampRadiusMeters = request.StampRadiusMeters,
            CoverImageUrl = coverUrl,
            SafetyNotes = request.SafetyNotes?.Trim(),
            SafetyNotesAr = request.SafetyNotesAr?.Trim(),
            CulturalTips = request.CulturalTips?.Trim(),
            CulturalTipsAr = request.CulturalTipsAr?.Trim()
        };

        foreach (var imageUrl in imageUrls)
            place.Images.Add(new PlaceImage { Url = imageUrl });

        foreach (var eventForm in request.HistoricalEvents)
            place.HistoricalEvents.Add(new HistoricalEvent
            {
                Title = eventForm.Title.Trim(),
                TitleAr = eventForm.TitleAr.Trim(),
                EventType = eventForm.EventType!.Value,
                Year = eventForm.Year,
                Era = eventForm.Era?.Trim(),
                Summary = eventForm.Summary.Trim(),
                SummaryAr = eventForm.SummaryAr.Trim(),
                Details = eventForm.Details.Trim(),
                DetailsAr = eventForm.DetailsAr.Trim()
            });

        db.Places.Add(place);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch
        {
            foreach (var savedUrl in savedUrls) fileStorage.Delete(savedUrl);
            throw;
        }

        return Created($"/api/places/{place.Id}", new { place.Id, place.Name, place.NameAr });
    }
}