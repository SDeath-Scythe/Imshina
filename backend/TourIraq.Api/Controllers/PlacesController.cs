using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourIraq.Api.Data;
using TourIraq.Api.DTOs;

namespace TourIraq.Api.Controllers;

[ApiController]
[Route("api/places")]
public class PlacesController(AppDbContext db) : ControllerBase
{
    // Extra convenience endpoint: used by the home page (featured) and the itinerary builder.
    [HttpGet]
    public async Task<ActionResult<PagedResult<PlaceSummaryDto>>> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10, CancellationToken ct = default)
    {
        (page, pageSize) = Paging.Clamp(page, pageSize);
        var total = await db.Places.CountAsync(ct);
        var items = await db.Places.AsNoTracking()
            .OrderBy(p => p.GovernorateId).ThenBy(p => p.Name)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(p => new PlaceSummaryDto
            {
                Id = p.Id,
                GovernorateId = p.GovernorateId,
                GovernorateName = p.Governorate.Name,
                Name = p.Name,
                NameAr = p.NameAr,
                ShortDescription = p.ShortDescription,
                ShortDescriptionAr = p.ShortDescriptionAr,
                Category = p.Category.ToString(),
                Latitude = p.Latitude,
                Longitude = p.Longitude,
                CoverImageUrl = p.CoverImageUrl
            }).ToListAsync(ct);
        return Ok(new PagedResult<PlaceSummaryDto> { Items = items, Page = page, PageSize = pageSize, TotalCount = total });
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PlaceDetailDto>> GetById(int id, CancellationToken ct)
    {
        var p = await db.Places.AsNoTracking()
            .Include(x => x.Governorate)
            .Include(x => x.Images)
            .Include(x => x.HistoricalEvents)
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        if (p is null) return Problem(statusCode: 404, title: "Place not found");

        return Ok(new PlaceDetailDto
        {
            HasStory = OnSiteStories.Has(p.Name),
            Id = p.Id,
            GovernorateId = p.GovernorateId,
            GovernorateName = p.Governorate.Name,
            Name = p.Name,
            NameAr = p.NameAr,
            ShortDescription = p.ShortDescription,
            ShortDescriptionAr = p.ShortDescriptionAr,
            Description = p.Description,
            DescriptionAr = p.DescriptionAr,
            Category = p.Category.ToString(),
            Latitude = p.Latitude,
            Longitude = p.Longitude,
            StampRadiusMeters = p.StampRadiusMeters,
            CoverImageUrl = p.CoverImageUrl,
            SafetyNotes = p.SafetyNotes,
            SafetyNotesAr = p.SafetyNotesAr,
            CulturalTips = p.CulturalTips,
            CulturalTipsAr = p.CulturalTipsAr,
            Images = p.Images.Select(i => new PlaceImageDto { Id = i.Id, Url = i.Url, Caption = i.Caption }).ToList(),
            HistoricalEvents = p.HistoricalEvents
                .OrderBy(e => e.Year ?? int.MaxValue)
                .Select(e => new HistoricalEventDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    TitleAr = e.TitleAr,
                    EventType = e.EventType.ToString(),
                    Year = e.Year,
                    Era = e.Era,
                    Summary = e.Summary,
                    SummaryAr = e.SummaryAr,
                    Details = e.Details,
                    DetailsAr = e.DetailsAr,
                    ImageUrl = e.ImageUrl
                }).ToList()
        });
    }
}
