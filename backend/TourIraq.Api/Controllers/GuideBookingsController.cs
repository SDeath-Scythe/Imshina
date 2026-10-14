using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourIraq.Api.Data;
using TourIraq.Api.DTOs;
using TourIraq.Api.Models;
using TourIraq.Api.Services;

namespace TourIraq.Api.Controllers;

/// <summary>
/// A guide's booking inbox: the requests travellers sent them, and the decisions on those requests.
/// Every query is filtered by the signed-in guide, so one guide never sees another guide's bookings.
/// </summary>
[ApiController]
[Route("api/guide/bookings")]
[Authorize(Roles = "Guide")]
public class GuideBookingsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<GuideBookingDto>>> Mine(CancellationToken ct)
    {
        var guideId = User.GetUserId()!.Value;
        var bookings = await db.Bookings.AsNoTracking()
            .Where(b => b.GuideUserId == guideId)
            .Include(b => b.User)
            .ToListAsync(ct);
        return Ok(bookings.OrderByDescending(b => b.CreatedAt).Select(ToDto).ToList());
    }

    /// <summary>Accept, decline, cancel or complete one of this guide's bookings (rules in <see cref="BookingRules"/>).</summary>
    [HttpPut("{id:int}/status")]
    public async Task<ActionResult<GuideBookingDto>> UpdateStatus(int id, UpdateBookingStatusRequest req, CancellationToken ct)
    {
        var guideId = User.GetUserId()!.Value;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Someone else's booking looks the same as a missing one.
        var booking = await db.Bookings.Include(b => b.User).FirstOrDefaultAsync(b => b.Id == id && b.GuideUserId == guideId, ct);
        if (booking is null) return Problem(statusCode: 404, title: "Booking not found");

        var to = req.Status!.Value;
        var refused = BookingRules.CheckProviderChange(booking, to, today);
        if (refused is { } r) return Problem(statusCode: r.Status, title: r.Title, detail: r.Detail);

        booking.Status = to;
        await db.SaveChangesAsync(ct);
        return Ok(ToDto(booking));
    }

    internal static GuideBookingDto ToDto(Booking b) => new()
    {
        Id = b.Id,
        Type = b.Type.ToString(),
        TripId = b.TripId,
        TripTitle = b.Trip?.Title,
        TouristName = b.User.FullName,
        TouristCountry = b.User.Country,
        StartDate = b.StartDate,
        EndDate = b.EndDate,
        Days = b.EndDate.DayNumber - b.StartDate.DayNumber + 1,
        TotalPrice = b.TotalPrice,
        Status = b.Status.ToString(),
        CreatedAt = b.CreatedAt,
    };
}
