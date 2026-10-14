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

    /// <summary>
    /// Allowed changes:
    /// Pending → Confirmed (accept, before the start date) · Pending → Cancelled (decline) ·
    /// Confirmed → Cancelled (before the start date) · Confirmed → Completed (once the last day has arrived).
    /// </summary>
    [HttpPut("{id:int}/status")]
    public async Task<ActionResult<GuideBookingDto>> UpdateStatus(int id, UpdateBookingStatusRequest req, CancellationToken ct)
    {
        var guideId = User.GetUserId()!.Value;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Someone else's booking looks the same as a missing one.
        var booking = await db.Bookings.Include(b => b.User).FirstOrDefaultAsync(b => b.Id == id && b.GuideUserId == guideId, ct);
        if (booking is null) return Problem(statusCode: 404, title: "Booking not found");

        var from = booking.Status;
        var to = req.Status!.Value;

        switch (to)
        {
            case BookingStatus.Confirmed:
                if (from != BookingStatus.Pending)
                    return Problem(statusCode: 409, title: "Already decided", detail: $"This booking is already {from}.");
                if (booking.StartDate < today)
                    return Problem(statusCode: 409, title: "Too late", detail: "The start date has passed, so this request can only be declined.");
                break;

            case BookingStatus.Cancelled:
                if (from == BookingStatus.Confirmed && booking.StartDate <= today)
                    return Problem(statusCode: 409, title: "Already started", detail: "A booking can't be cancelled on or after its start date.");
                if (from != BookingStatus.Pending && from != BookingStatus.Confirmed)
                    return Problem(statusCode: 409, title: "Already decided", detail: $"This booking is already {from}.");
                break;

            case BookingStatus.Completed:
                if (from != BookingStatus.Confirmed)
                    return Problem(statusCode: 409, title: "Not confirmed", detail: "Only a confirmed booking can be marked as completed.");
                if (booking.EndDate > today)
                    return Problem(statusCode: 409, title: "Not finished yet", detail: "A booking can be marked as completed from its last day.");
                break;

            default:
                return Problem(statusCode: 400, title: "Invalid status", detail: "Status must be Confirmed, Cancelled or Completed.");
        }

        booking.Status = to;
        await db.SaveChangesAsync(ct);
        return Ok(ToDto(booking));
    }

    private static GuideBookingDto ToDto(Booking b) => new()
    {
        Id = b.Id,
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
