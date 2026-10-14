using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourIraq.Api.Data;
using TourIraq.Api.DTOs;
using TourIraq.Api.Models;
using TourIraq.Api.Services;

namespace TourIraq.Api.Controllers;

/// <summary>
/// Ready-made trips are run by the Imshina team, so admins answer trip bookings:
/// the same accept / decline / cancel / complete rules a guide has for guide bookings.
/// </summary>
[ApiController]
[Route("api/admin/trip-bookings")]
[Authorize(Roles = "Admin")]
public class AdminTripBookingsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<GuideBookingDto>>> GetAll(CancellationToken ct)
    {
        var bookings = await db.Bookings.AsNoTracking()
            .Where(b => b.Type == BookingType.Trip)
            .Include(b => b.User).Include(b => b.Trip)
            .ToListAsync(ct);
        return Ok(bookings.OrderByDescending(b => b.CreatedAt).Select(GuideBookingsController.ToDto).ToList());
    }

    [HttpPut("{id:int}/status")]
    public async Task<ActionResult<GuideBookingDto>> UpdateStatus(int id, UpdateBookingStatusRequest req, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var booking = await db.Bookings.Include(b => b.User).Include(b => b.Trip)
            .FirstOrDefaultAsync(b => b.Id == id && b.Type == BookingType.Trip, ct);
        if (booking is null) return Problem(statusCode: 404, title: "Booking not found");

        var to = req.Status!.Value;
        var refused = BookingRules.CheckProviderChange(booking, to, today);
        if (refused is { } r) return Problem(statusCode: r.Status, title: r.Title, detail: r.Detail);

        booking.Status = to;
        await db.SaveChangesAsync(ct);
        return Ok(GuideBookingsController.ToDto(booking));
    }
}
