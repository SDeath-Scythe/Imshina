namespace TourIraq.Api.Models;

public class Trip
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DurationDays { get; set; }
    public decimal Price { get; set; } // USD in this MVP
    public string? CoverImageUrl { get; set; }
    public bool IsReadyMade { get; set; }
    public int OwnerId { get; set; }
    public User Owner { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<TripPlace> TripPlaces { get; set; } = new();
}

public class TripPlace
{
    public int TripId { get; set; }
    public Trip Trip { get; set; } = null!;
    public int PlaceId { get; set; }
    public Place Place { get; set; } = null!;
    public int DayNumber { get; set; }
    public int OrderInDay { get; set; }
}

public class Booking
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public BookingType Type { get; set; }
    public int? TripId { get; set; }
    public Trip? Trip { get; set; }
    public int? GuideUserId { get; set; }
    public User? GuideUser { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public decimal TotalPrice { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
