using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourIraq.Api.Data;
using TourIraq.Api.DTOs;
using TourIraq.Api.Models;

namespace TourIraq.Api.Controllers;

/// <summary>
/// Visitor numbers for tourism authorities and site managers: stamps per site and city,
/// where travellers come from, and when they visit. Aggregates only.
/// Small rows are loaded and grouped in memory, which is fine at MVP scale; move the grouping
/// into SQL (or a nightly summary table) once there are hundreds of thousands of stamps.
/// </summary>
[ApiController]
[Route("api/admin/insights")]
[Authorize(Roles = "Admin")]
public class AdminInsightsController(AppDbContext db) : ControllerBase
{
    private const int Days = 30;

    [HttpGet]
    public async Task<ActionResult<InsightsDto>> Get(CancellationToken ct)
    {
        var stamps = await db.Stamps.AsNoTracking()
            .Select(s => new { s.UserId, s.PlaceId, s.CreatedAt })
            .ToListAsync(ct);
        var places = await db.Places.AsNoTracking()
            .Select(p => new { p.Id, p.Name, p.NameAr, Gov = p.Governorate.Name, GovAr = p.Governorate.NameAr })
            .ToListAsync(ct);

        var travellerIds = stamps.Select(s => s.UserId).Distinct().ToList();
        var countries = await db.Users.AsNoTracking()
            .Where(u => travellerIds.Contains(u.Id))
            .Select(u => u.Country)
            .ToListAsync(ct);

        var statuses = await db.Bookings.AsNoTracking().Select(b => b.Status).ToListAsync(ct);
        var rewardThresholds = await db.Rewards.AsNoTracking().Select(r => r.RequiredStamps).ToListAsync(ct);

        // Rewards are unlocked by stamp count, so count, per traveller, the rewards their count reaches.
        var rewardsUnlocked = stamps.GroupBy(s => s.UserId)
            .Sum(g => rewardThresholds.Count(required => g.Count() >= required));

        var perPlace = stamps.GroupBy(s => s.PlaceId).ToDictionary(g => g.Key, g => g.Count());
        var placeStats = places
            .Select(p => new PlaceStat { PlaceId = p.Id, Name = p.Name, NameAr = p.NameAr, Governorate = p.Gov, Stamps = perPlace.GetValueOrDefault(p.Id) })
            .OrderByDescending(p => p.Stamps).ThenBy(p => p.Name)
            .ToList();

        var governorates = places
            .GroupBy(p => new { p.Gov, p.GovAr })
            .Select(g => new NamedCount { Name = g.Key.Gov, NameAr = g.Key.GovAr, Count = g.Sum(p => perPlace.GetValueOrDefault(p.Id)) })
            .OrderByDescending(g => g.Count).ThenBy(g => g.Name)
            .ToList();

        var countryStats = countries
            .Select(c => string.IsNullOrWhiteSpace(c) ? "Unknown" : c.Trim())
            .GroupBy(c => c)
            .Select(g => new NamedCount { Name = g.Key, Count = g.Count() })
            .OrderByDescending(c => c.Count).ThenBy(c => c.Name)
            .ToList();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var perDay = stamps.GroupBy(s => DateOnly.FromDateTime(s.CreatedAt)).ToDictionary(g => g.Key, g => g.Count());
        var days = Enumerable.Range(0, Days)
            .Select(i => today.AddDays(i - (Days - 1)))
            .Select(d => new DayCount { Date = d, Count = perDay.GetValueOrDefault(d) })
            .ToList();

        var weekdays = new int[7];
        foreach (var s in stamps) weekdays[(int)s.CreatedAt.DayOfWeek]++;

        return Ok(new InsightsDto
        {
            Totals = new InsightsTotals
            {
                Stamps = stamps.Count,
                Travellers = travellerIds.Count,
                RegisteredTravellers = await db.Users.CountAsync(u => u.Role == UserRole.Tourist, ct),
                Guides = await db.GuideProfiles.CountAsync(ct),
                Bookings = statuses.Count,
                ConfirmedBookings = statuses.Count(s => s == BookingStatus.Confirmed),
                CompletedBookings = statuses.Count(s => s == BookingStatus.Completed),
                RewardsUnlocked = rewardsUnlocked,
            },
            Places = placeStats,
            Governorates = governorates,
            Countries = countryStats,
            Days = days,
            Weekdays = weekdays,
        });
    }
}
