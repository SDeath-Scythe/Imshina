namespace TourIraq.Api.Models;

// PK = UserId (one-to-one with User)
public class GuideProfile
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string Bio { get; set; } = string.Empty;
    public decimal PricePerDay { get; set; }
    public double AvgRating { get; set; }
    public int ReviewsCount { get; set; }

    // Languages are stored relationally (SQLite has no text[] type).
    public List<GuideLanguage> Languages { get; set; } = new();
    public List<GuidePlace> Places { get; set; } = new();
    public List<GuideReview> Reviews { get; set; } = new();
}

public class GuideLanguage
{
    public int GuideUserId { get; set; }
    public GuideProfile Guide { get; set; } = null!;
    public string Language { get; set; } = string.Empty;
}

public class GuidePlace
{
    public int GuideUserId { get; set; }
    public GuideProfile Guide { get; set; } = null!;
    public int PlaceId { get; set; }
    public Place Place { get; set; } = null!;
}

public class GuideReview
{
    public int Id { get; set; }
    public int GuideUserId { get; set; }
    public GuideProfile Guide { get; set; } = null!;
    public int TouristId { get; set; }
    public User Tourist { get; set; } = null!;
    public int BookingId { get; set; }
    public Booking Booking { get; set; } = null!;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
