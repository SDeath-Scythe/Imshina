using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourIraq.Api.Data;
using TourIraq.Api.DTOs;
using TourIraq.Api.Models;
using TourIraq.Api.Services;

namespace TourIraq.Api.Controllers;

[ApiController]
[Route("api/guides")]
public class GuidesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<GuideSummaryDto>>> GetAll(
        [FromQuery] string? language, [FromQuery] int? governorateId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10, CancellationToken ct = default)
    {
        var query = db.GuideProfiles.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(language))
        {
            var lang = language.Trim();
            query = query.Where(g => g.Languages.Any(l => EF.Functions.Like(l.Language, lang)));
        }
        if (governorateId is not null)
        {
            var gid = governorateId.Value;
            query = query.Where(g => g.Places.Any(gp => gp.Place.GovernorateId == gid));
        }

        (page, pageSize) = Paging.Clamp(page, pageSize);
        var total = await query.CountAsync(ct);

        var guides = await query
            .OrderByDescending(g => g.AvgRating).ThenBy(g => g.UserId)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Include(g => g.User)
            .Include(g => g.Languages)
            .Include(g => g.Places).ThenInclude(gp => gp.Place)
            .AsSplitQuery()
            .ToListAsync(ct);

        return Ok(new PagedResult<GuideSummaryDto>
        {
            Items = guides.Select(g => ToSummary(g)).ToList(),
            Page = page, PageSize = pageSize, TotalCount = total
        });
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<GuideDetailDto>> GetById(int id, CancellationToken ct)
    {
        var g = await db.GuideProfiles.AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.Languages)
            .Include(x => x.Places).ThenInclude(gp => gp.Place)
            .Include(x => x.Reviews).ThenInclude(r => r.Tourist)
            .AsSplitQuery()
            .FirstOrDefaultAsync(x => x.UserId == id, ct);

        if (g is null) return Problem(statusCode: 404, title: "Guide not found");

        var summary = ToSummary(g);
        return Ok(new GuideDetailDto
        {
            UserId = summary.UserId, FullName = summary.FullName, Country = summary.Country, Bio = summary.Bio,
            PricePerDay = summary.PricePerDay, AvgRating = summary.AvgRating, ReviewsCount = summary.ReviewsCount,
            Languages = summary.Languages, Destinations = summary.Destinations,
            BookingInfo = "Book this guide per day via POST /api/bookings (type Guide). Total price = price per day x number of days.",
            Reviews = g.Reviews.OrderByDescending(r => r.CreatedAt).Select(r => new ReviewDto
            {
                Id = r.Id, TouristName = r.Tourist.FullName, Rating = r.Rating,
                Comment = r.Comment, CreatedAt = r.CreatedAt
            }).ToList()
        });
    }

    [HttpPost("{id:int}/reviews")]
    [Authorize(Roles = "Tourist")]
    public async Task<ActionResult<ReviewDto>> CreateReview(int id, CreateReviewRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId()!.Value;

        var guide = await db.GuideProfiles.FirstOrDefaultAsync(g => g.UserId == id, ct);
        if (guide is null) return Problem(statusCode: 404, title: "Guide not found");

        var booking = await db.Bookings.FirstOrDefaultAsync(b => b.Id == req.BookingId, ct);

        // The booking must be this tourist's own, for this guide, and Completed.
        if (booking is null || booking.UserId != userId || booking.Type != BookingType.Guide || booking.GuideUserId != id)
            return Problem(statusCode: 403, title: "Not allowed", detail: "You can only review a guide through your own booking with that guide.");

        if (booking.Status != BookingStatus.Completed)
            return Problem(statusCode: 400, title: "Booking not completed", detail: "You can review a guide only after the booking is Completed.");

        if (await db.GuideReviews.AnyAsync(r => r.BookingId == booking.Id, ct))
            return Problem(statusCode: 409, title: "Already reviewed", detail: "This booking already has a review.");

        await using var tx = await db.Database.BeginTransactionAsync(ct);
        try
        {
            var review = new GuideReview
            {
                GuideUserId = id, TouristId = userId, BookingId = booking.Id,
                Rating = req.Rating!.Value, Comment = (req.Comment ?? string.Empty).Trim(), CreatedAt = DateTime.UtcNow
            };
            db.GuideReviews.Add(review);
            await db.SaveChangesAsync(ct);

            var ratings = await db.GuideReviews.Where(r => r.GuideUserId == id).Select(r => r.Rating).ToListAsync(ct);
            guide.ReviewsCount = ratings.Count;
            guide.AvgRating = Math.Round(ratings.Average(), 2);
            await db.SaveChangesAsync(ct);

            await tx.CommitAsync(ct);

            var name = await db.Users.Where(u => u.Id == userId).Select(u => u.FullName).FirstAsync(ct);
            return StatusCode(201, new ReviewDto { Id = review.Id, TouristName = name, Rating = review.Rating, Comment = review.Comment, CreatedAt = review.CreatedAt });
        }
        catch (DbUpdateException)
        {
            return Problem(statusCode: 409, title: "Already reviewed", detail: "This booking already has a review.");
        }
    }

    private static GuideSummaryDto ToSummary(GuideProfile g) => new()
    {
        UserId = g.UserId, FullName = g.User.FullName, Country = g.User.Country, Bio = g.Bio,
        PricePerDay = g.PricePerDay, AvgRating = g.AvgRating, ReviewsCount = g.ReviewsCount,
        Languages = g.Languages.Select(l => l.Language).OrderBy(l => l).ToList(),
        Destinations = g.Places.Select(p => new PlaceRefDto { Id = p.PlaceId, Name = p.Place.Name, GovernorateId = p.Place.GovernorateId })
            .OrderBy(p => p.Name).ToList()
    };
}
