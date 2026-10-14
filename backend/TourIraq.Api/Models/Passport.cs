namespace TourIraq.Api.Models;

public class Stamp
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int PlaceId { get; set; }
    public Place Place { get; set; } = null!;
    public string PhotoUrl { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double DistanceFromPlaceMeters { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Partner
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public PartnerType Type { get; set; }
    public int GovernorateId { get; set; }
    public Governorate Governorate { get; set; } = null!;
    public string Address { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string? LogoUrl { get; set; }
    public List<Reward> Rewards { get; set; } = new();
}

public class Reward
{
    public int Id { get; set; }
    public int PartnerId { get; set; }
    public Partner Partner { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public int DiscountPercent { get; set; }
    public int RequiredStamps { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
