using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourIraq.Api.Data;
using TourIraq.Api.DTOs;
using TourIraq.Api.Models;
using TourIraq.Api.Services;

namespace TourIraq.Api.Controllers;

[ApiController]
[Route("api/groups")]
public class GroupsController(AppDbContext db) : ControllerBase
{
    // Joins and approvals are serialized so capacity cannot be exceeded by concurrent requests
    // (single-instance MVP; use a DB-level lock or a queue when scaling out).
    private static readonly SemaphoreSlim CapacityLock = new(1, 1);

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<PagedResult<GroupDto>>> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10, CancellationToken ct = default)
    {
        (page, pageSize) = Paging.Clamp(page, pageSize);
        var currentUserId = User.GetUserId(); // populated when a valid token is sent

        var total = await db.TourGroups.CountAsync(ct);
        var groups = await db.TourGroups.AsNoTracking()
            .OrderBy(g => g.StartDate).ThenBy(g => g.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Include(g => g.Creator).Include(g => g.Trip).Include(g => g.Members)
            .AsSplitQuery()
            .ToListAsync(ct);

        return Ok(new PagedResult<GroupDto>
        {
            Items = groups.Select(g => ToDto(g, currentUserId)).ToList(),
            Page = page, PageSize = pageSize, TotalCount = total
        });
    }

    [HttpPost]
    [Authorize(Roles = "Tourist,Agency")]
    public async Task<ActionResult<GroupDto>> Create(CreateGroupRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId()!.Value;
        var user = await db.Users.AsNoTracking().FirstAsync(u => u.Id == userId, ct);

        if (req.StartDate!.Value < DateOnly.FromDateTime(DateTime.UtcNow))
            return Problem(statusCode: 400, title: "Invalid date", detail: "Start date cannot be in the past.");

        // A tourist cannot create a group their own gender could not join.
        if (user.Role == UserRole.Tourist &&
            ((req.GenderType == GroupGenderType.MenOnly && user.Gender != Gender.Male) ||
             (req.GenderType == GroupGenderType.WomenOnly && user.Gender != Gender.Female)))
            return Problem(statusCode: 400, title: "Invalid group type", detail: "Your account does not match this group's gender restriction.");

        if (req.TripId is not null)
        {
            var ok = await db.Trips.AnyAsync(t => t.Id == req.TripId && t.IsReadyMade, ct);
            if (!ok) return Problem(statusCode: 400, title: "Invalid trip", detail: "tripId must reference a ready-made trip.");
        }

        var group = new TourGroup
        {
            Name = req.Name.Trim(), Description = (req.Description ?? string.Empty).Trim(),
            GenderType = req.GenderType!.Value, MaxMembers = req.MaxMembers!.Value,
            CreatorId = userId, TripId = req.TripId, StartDate = req.StartDate.Value, CreatedAt = DateTime.UtcNow
        };
        db.TourGroups.Add(group);
        await db.SaveChangesAsync(ct);

        var saved = await db.TourGroups.AsNoTracking().Include(g => g.Creator).Include(g => g.Trip).Include(g => g.Members)
            .FirstAsync(g => g.Id == group.Id, ct);
        return StatusCode(201, ToDto(saved, userId));
    }

    [HttpPost("{id:int}/join")]
    [Authorize(Roles = "Tourist")]
    public async Task<ActionResult<GroupDto>> Join(int id, CancellationToken ct)
    {
        var userId = User.GetUserId()!.Value;

        await CapacityLock.WaitAsync(ct);
        try
        {
            var group = await db.TourGroups.Include(g => g.Members).Include(g => g.Creator).Include(g => g.Trip)
                .FirstOrDefaultAsync(g => g.Id == id, ct);
            if (group is null) return Problem(statusCode: 404, title: "Group not found");

            var user = await db.Users.AsNoTracking().FirstAsync(u => u.Id == userId, ct);

            if (group.CreatorId == userId)
                return Problem(statusCode: 409, title: "Already a member", detail: "You created this group.");

            if ((group.GenderType == GroupGenderType.MenOnly && user.Gender != Gender.Male) ||
                (group.GenderType == GroupGenderType.WomenOnly && user.Gender != Gender.Female))
                return Problem(statusCode: 403, title: "Not eligible", detail: "This group's gender restriction does not match your account.");

            if (group.Members.Any(m => m.UserId == userId))
                return Problem(statusCode: 409, title: "Duplicate request", detail: "You already requested to join this group.");

            if (MembersCount(group) >= group.MaxMembers)
                return Problem(statusCode: 409, title: "Group full", detail: "This group has reached its member limit.");

            var member = new GroupMember { GroupId = id, UserId = userId, Status = MembershipStatus.Pending, JoinedAt = DateTime.UtcNow };
            db.GroupMembers.Add(member);
            try { await db.SaveChangesAsync(ct); }
            catch (DbUpdateException)
            {
                return Problem(statusCode: 409, title: "Duplicate request", detail: "You already requested to join this group.");
            }

            if (!group.Members.Contains(member)) group.Members.Add(member); // EF relationship fix-up may already have added it
            return Ok(ToDto(group, userId));
        }
        finally { CapacityLock.Release(); }
    }

    // Creator only: list members including pending requests.
    [HttpGet("{id:int}/members")]
    [Authorize(Roles = "Tourist,Agency")]
    public async Task<ActionResult<List<GroupMemberDto>>> Members(int id, CancellationToken ct)
    {
        var userId = User.GetUserId()!.Value;
        var group = await db.TourGroups.AsNoTracking().FirstOrDefaultAsync(g => g.Id == id, ct);
        if (group is null) return Problem(statusCode: 404, title: "Group not found");
        if (group.CreatorId != userId) return Problem(statusCode: 403, title: "Forbidden", detail: "Only the group creator can view membership requests.");

        var members = await db.GroupMembers.AsNoTracking().Where(m => m.GroupId == id).Include(m => m.User).ToListAsync(ct);
        return Ok(members.OrderBy(m => m.JoinedAt).Select(m => new GroupMemberDto
        {
            UserId = m.UserId, FullName = m.User.FullName, Country = m.User.Country,
            Status = m.Status.ToString(), JoinedAt = m.JoinedAt
        }).ToList());
    }

    [HttpPut("{id:int}/members/{userId:int}")]
    [Authorize(Roles = "Tourist,Agency")]
    public async Task<ActionResult<GroupMemberDto>> UpdateMember(int id, int userId, UpdateMemberRequest req, CancellationToken ct)
    {
        var currentUserId = User.GetUserId()!.Value;

        if (req.Status != MembershipStatus.Approved && req.Status != MembershipStatus.Rejected)
            return Problem(statusCode: 400, title: "Invalid status", detail: "Status must be Approved or Rejected.");

        await CapacityLock.WaitAsync(ct);
        try
        {
            var group = await db.TourGroups.Include(g => g.Members).FirstOrDefaultAsync(g => g.Id == id, ct);
            if (group is null) return Problem(statusCode: 404, title: "Group not found");

            // Only the creator decides. This also stops anyone approving themselves.
            if (group.CreatorId != currentUserId)
                return Problem(statusCode: 403, title: "Forbidden", detail: "Only the group creator can approve or reject members.");

            var member = group.Members.FirstOrDefault(m => m.UserId == userId);
            if (member is null) return Problem(statusCode: 404, title: "Request not found");

            if (member.Status != MembershipStatus.Pending)
                return Problem(statusCode: 409, title: "Already decided", detail: $"This request is already {member.Status}.");

            if (req.Status == MembershipStatus.Approved && MembersCount(group) >= group.MaxMembers)
                return Problem(statusCode: 409, title: "Group full", detail: "Cannot approve: the group has reached its member limit.");

            member.Status = req.Status!.Value;
            await db.SaveChangesAsync(ct);

            var user = await db.Users.AsNoTracking().FirstAsync(u => u.Id == userId, ct);
            return Ok(new GroupMemberDto { UserId = userId, FullName = user.FullName, Country = user.Country, Status = member.Status.ToString(), JoinedAt = member.JoinedAt });
        }
        finally { CapacityLock.Release(); }
    }

    // Creator counts toward capacity; only Approved members add to it (Pending/Rejected do not).
    private static int MembersCount(TourGroup g) => 1 + g.Members.Count(m => m.Status == MembershipStatus.Approved);

    private static GroupDto ToDto(TourGroup g, int? currentUserId) => new()
    {
        Id = g.Id, Name = g.Name, Description = g.Description, GenderType = g.GenderType.ToString(),
        MaxMembers = g.MaxMembers, CreatorId = g.CreatorId, CreatorName = g.Creator.FullName,
        TripId = g.TripId, TripTitle = g.Trip?.Title, StartDate = g.StartDate,
        MembersCount = MembersCount(g),
        MyStatus = currentUserId is null ? null : g.Members.FirstOrDefault(m => m.UserId == currentUserId)?.Status.ToString()
    };
}
