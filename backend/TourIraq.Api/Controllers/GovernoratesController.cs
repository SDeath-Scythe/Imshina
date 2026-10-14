using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourIraq.Api.Data;
using TourIraq.Api.DTOs;
using TourIraq.Api.Models;

namespace TourIraq.Api.Controllers;

[ApiController]
[Route("api/governorates")]
public class GovernoratesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<GovernorateDto>>> GetAll(CancellationToken ct)
    {
        var items = await db.Governorates.AsNoTracking()
            .OrderBy(g => g.Name)
            .Select(g => new GovernorateDto
            {
                Id = g.Id,
                Name = g.Name,
                NameAr = g.NameAr,
                Description = g.Description,
                DescriptionAr = g.DescriptionAr,
                ImageUrl = g.ImageUrl,
                PlacesCount = g.Places.Count
            }).ToListAsync(ct);
        return Ok(items);
    }

    [HttpGet("{id:int}/places")]
    public async Task<ActionResult<PagedResult<PlaceSummaryDto>>> GetPlaces(
        int id, [FromQuery] string? category, [FromQuery] int page = 1, [FromQuery] int pageSize = 10, CancellationToken ct = default)
    {
        if (!await db.Governorates.AnyAsync(g => g.Id == id, ct))
            return Problem(statusCode: 404, title: "Governorate not found");

        var query = db.Places.AsNoTracking().Where(p => p.GovernorateId == id);

        if (!string.IsNullOrWhiteSpace(category))
        {
            if (!Enum.TryParse<PlaceCategory>(category, true, out var cat))
                return Problem(statusCode: 400, title: "Invalid category",
                    detail: $"Allowed values: {string.Join(", ", Enum.GetNames<PlaceCategory>())}.");
            query = query.Where(p => p.Category == cat);
        }

        (page, pageSize) = Paging.Clamp(page, pageSize);
        var total = await query.CountAsync(ct);
        var items = await query.OrderBy(p => p.Name)
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
}
