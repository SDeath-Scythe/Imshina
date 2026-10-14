using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourIraq.Api.Data;
using TourIraq.Api.DTOs;
using TourIraq.Api.Services;

namespace TourIraq.Api.Controllers;

/// <summary>
/// The on-site story for a place. Only travellers who hold that place's stamp get it, which means
/// they have stood at the site: the reward for going, not just reading.
/// </summary>
[ApiController]
[Route("api/places/{id:int}/story")]
[Authorize(Roles = "Tourist")]
public class PlaceStoriesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PlaceStoryDto>> Get(int id, CancellationToken ct)
    {
        var userId = User.GetUserId()!.Value;
        var name = await db.Places.AsNoTracking().Where(p => p.Id == id).Select(p => p.Name).FirstOrDefaultAsync(ct);
        if (name is null) return Problem(statusCode: 404, title: "Place not found");

        var story = OnSiteStories.For(name);
        if (story is null) return Problem(statusCode: 404, title: "No story", detail: "This place has no on-site story yet.");

        var stamped = await db.Stamps.AnyAsync(s => s.UserId == userId && s.PlaceId == id, ct);
        if (!stamped)
            return Problem(statusCode: 403, title: "Stamp needed", detail: "Collect this place's stamp on site to unlock its story.");

        return Ok(new PlaceStoryDto
        {
            PlaceId = id,
            Title = story.Title, Text = story.Text, LookFor = story.LookFor,
            TitleAr = story.TitleAr, TextAr = story.TextAr, LookForAr = story.LookForAr,
        });
    }
}
