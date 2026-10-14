namespace TourIraq.Api.Models;

public class TourGroup
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public GroupGenderType GenderType { get; set; }
    public int MaxMembers { get; set; }
    public int CreatorId { get; set; }
    public User Creator { get; set; } = null!;
    public int? TripId { get; set; }
    public Trip? Trip { get; set; }
    public DateOnly StartDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<GroupMember> Members { get; set; } = new();
}

public class GroupMember
{
    public int GroupId { get; set; }
    public TourGroup Group { get; set; } = null!;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public MembershipStatus Status { get; set; } = MembershipStatus.Pending;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}
