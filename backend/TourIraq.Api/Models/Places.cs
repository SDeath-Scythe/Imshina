namespace TourIraq.Api.Models;

public class Governorate
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string DescriptionAr { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public List<Place> Places { get; set; } = new();
}

public class Place
{
    public int Id { get; set; }
    public int GovernorateId { get; set; }
    public Governorate Governorate { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string ShortDescriptionAr { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string DescriptionAr { get; set; } = string.Empty;
    public PlaceCategory Category { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public int StampRadiusMeters { get; set; } = 150;
    public string? CoverImageUrl { get; set; }
    public string? SafetyNotes { get; set; }
    public string? SafetyNotesAr { get; set; }
    public string? CulturalTips { get; set; }
    public string? CulturalTipsAr { get; set; }

    public List<PlaceImage> Images { get; set; } = new();
    public List<HistoricalEvent> HistoricalEvents { get; set; } = new();
    public List<GuidePlace> GuidePlaces { get; set; } = new();
}

public class PlaceImage
{
    public int Id { get; set; }
    public int PlaceId { get; set; }
    public Place Place { get; set; } = null!;
    public string Url { get; set; } = string.Empty;
    public string? Caption { get; set; }
}

public class HistoricalEvent
{
    public int Id { get; set; }
    public int PlaceId { get; set; }
    public Place Place { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public EventType EventType { get; set; }
    public int? Year { get; set; }   // negative = BCE
    public string? Era { get; set; }
    public string Summary { get; set; } = string.Empty;
    public string SummaryAr { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public string DetailsAr { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
}
