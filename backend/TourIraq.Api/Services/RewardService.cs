using Microsoft.EntityFrameworkCore;
using TourIraq.Api.Data;
using TourIraq.Api.DTOs;

namespace TourIraq.Api.Services;

/// Rewards are computed dynamically: unlocked when stampCount >= RequiredStamps.
public class RewardService(AppDbContext db)
{
    public async Task<List<RewardDto>> GetRewardsAsync(int userId, CancellationToken ct)
    {
        var count = await db.Stamps.CountAsync(s => s.UserId == userId, ct);
        var now = DateTime.UtcNow;

        var rewards = await db.Rewards.AsNoTracking()
            .Include(r => r.Partner)
            .Where(r => r.ExpiresAt == null || r.ExpiresAt > now)
            .OrderBy(r => r.RequiredStamps)
            .ToListAsync(ct);

        return rewards.Select(r => new RewardDto
        {
            Id = r.Id,
            Title = r.Title,
            PartnerName = r.Partner.Name,
            PartnerType = r.Partner.Type.ToString(),
            DiscountPercent = r.DiscountPercent,
            RequiredStamps = r.RequiredStamps,
            ExpiresAt = r.ExpiresAt,
            IsUnlocked = count >= r.RequiredStamps
        }).ToList();
    }

    /// Rewards whose threshold was crossed by going from `before` to `after` stamps.
    public async Task<List<UnlockedRewardDto>> GetNewlyUnlockedAsync(int before, int after, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var rewards = await db.Rewards.AsNoTracking()
            .Include(r => r.Partner)
            .Where(r => r.RequiredStamps > before && r.RequiredStamps <= after)
            .Where(r => r.ExpiresAt == null || r.ExpiresAt > now)
            .ToListAsync(ct);

        return rewards.Select(r => new UnlockedRewardDto
        {
            RewardId = r.Id,
            Title = r.Title,
            PartnerName = r.Partner.Name
        }).ToList();
    }
}
