using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourIraq.Api.Data;
using TourIraq.Api.DTOs;
using TourIraq.Api.Models;
using TourIraq.Api.Services;

namespace TourIraq.Api.Controllers;

[ApiController]
[Route("api/bookings")]
[Authorize(Roles = "Tourist")]
public class BookingsController(AppDbContext db) : ControllerBase
{
    private const int MaxGuideDays = 30;

    [HttpPost]
    public async Task<ActionResult<BookingDto>> Create(CreateBookingRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId()!.Value;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var start = req.StartDate!.Value;

        if (start < today)
            return Problem(statusCode: 400, title: "Invalid dates", detail: "Start date cannot be in the past.");

        var booking = new Booking { UserId = userId, Type = req.Type!.Value, StartDate = start, Status = BookingStatus.Pending, CreatedAt = DateTime.UtcNow };

        if (req.Type == BookingType.Trip)
        {
            // A trip booking must reference a trip and must NOT reference a guide.
            if (req.TripId is null || req.GuideUserId is not null)
                return Problem(statusCode: 400, title: "Invalid booking", detail: "A trip booking needs tripId and must not include guideUserId.");

            var trip = await db.Trips.AsNoTracking().FirstOrDefaultAsync(t => t.Id == req.TripId, ct);
            if (trip is null || !trip.IsReadyMade)
                return Problem(statusCode: 404, title: "Trip not found", detail: "Only ready-made trips can be booked.");

            booking.TripId = trip.Id;
            booking.EndDate = start.AddDays(trip.DurationDays - 1);
            booking.TotalPrice = trip.Price; // price always comes from the server
        }
        else
        {
            if (req.GuideUserId is null || req.TripId is not null)
                return Problem(statusCode: 400, title: "Invalid booking", detail: "A guide booking needs guideUserId and must not include tripId.");
            if (req.EndDate is null)
                return Problem(statusCode: 400, title: "Invalid dates", detail: "End date is required for guide bookings.");

            var end = req.EndDate.Value;
            if (end < start)
                return Problem(statusCode: 400, title: "Invalid dates", detail: "End date must be on or after the start date.");

            var days = end.DayNumber - start.DayNumber + 1;
            if (days > MaxGuideDays)
                return Problem(statusCode: 400, title: "Invalid dates", detail: $"A guide booking can be at most {MaxGuideDays} days.");

            var guide = await db.GuideProfiles.AsNoTracking().FirstOrDefaultAsync(g => g.UserId == req.GuideUserId, ct);
            if (guide is null) return Problem(statusCode: 404, title: "Guide not found");

            var overlaps = await db.Bookings.AnyAsync(b =>
                b.GuideUserId == guide.UserId &&
                (b.Status == BookingStatus.Pending || b.Status == BookingStatus.Confirmed) &&
                b.StartDate <= end && b.EndDate >= start, ct);
            if (overlaps)
                return Problem(statusCode: 409, title: "Guide unavailable", detail: "This guide already has a booking on those dates.");

            booking.GuideUserId = guide.UserId;
            booking.EndDate = end;
            booking.TotalPrice = Math.Round(guide.PricePerDay * days, 2);
        }

        db.Bookings.Add(booking);
        await db.SaveChangesAsync(ct);

        var dto = (await LoadDtos(userId, b => b.Id == booking.Id, ct)).First();
        return StatusCode(201, dto);
    }

    [HttpGet("me")]
    public async Task<ActionResult<List<BookingDto>>> Mine(CancellationToken ct)
    {
        var userId = User.GetUserId()!.Value;
        return Ok(await LoadDtos(userId, _ => true, ct));
    }

    /// <summary>The traveller cancels their own booking: any time while pending, or before the start date once confirmed.</summary>
    [HttpPost("{id:int}/cancel")]
    public async Task<ActionResult<BookingDto>> Cancel(int id, CancellationToken ct)
    {
        var userId = User.GetUserId()!.Value;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var booking = await db.Bookings.FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId, ct);
        if (booking is null) return Problem(statusCode: 404, title: "Booking not found");

        if (booking.Status == BookingStatus.Confirmed && booking.StartDate <= today)
            return Problem(statusCode: 409, title: "Already started", detail: "A booking can't be cancelled on or after its start date.");
        if (booking.Status != BookingStatus.Pending && booking.Status != BookingStatus.Confirmed)
            return Problem(statusCode: 409, title: "Can't cancel", detail: $"This booking is already {booking.Status}.");

        booking.Status = BookingStatus.Cancelled;
        await db.SaveChangesAsync(ct);
        return Ok((await LoadDtos(userId, b => b.Id == id, ct)).First());
    }

    // Always filtered by the current user, so private bookings are never exposed to others.
    private async Task<List<BookingDto>> LoadDtos(int userId, System.Linq.Expressions.Expression<Func<Booking, bool>> filter, CancellationToken ct)
    {
        var bookings = await db.Bookings.AsNoTracking()
            .Where(b => b.UserId == userId).Where(filter)
            .Include(b => b.Trip).Include(b => b.GuideUser)
            .ToListAsync(ct);
        bookings = bookings.OrderByDescending(b => b.CreatedAt).ToList();

        var ids = bookings.Select(b => b.Id).ToList();
        var reviewed = (await db.GuideReviews.Where(r => ids.Contains(r.BookingId)).Select(r => r.BookingId).ToListAsync(ct)).ToHashSet();

        return bookings.Select(b => new BookingDto
        {
            Id = b.Id, Type = b.Type.ToString(), TripId = b.TripId, TripTitle = b.Trip?.Title,
            GuideUserId = b.GuideUserId, GuideName = b.GuideUser?.FullName,
            StartDate = b.StartDate, EndDate = b.EndDate, TotalPrice = b.TotalPrice,
            Status = b.Status.ToString(), CreatedAt = b.CreatedAt,
            CanReview = b.Type == BookingType.Guide && b.Status == BookingStatus.Completed && !reviewed.Contains(b.Id)
        }).ToList();
    }
}
