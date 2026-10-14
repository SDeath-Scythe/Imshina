using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
using TourIraq.Api.Models;

namespace TourIraq.Api.DTOs;

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
}

// ---------- Auth ----------
public class RegisterRequest
{
    [Required, MaxLength(120)] public string FullName { get; set; } = string.Empty;
    [Required, EmailAddress, MaxLength(256)] public string Email { get; set; } = string.Empty;
    [Required, MinLength(8), MaxLength(100)] public string Password { get; set; } = string.Empty;
    [Required] public UserRole? Role { get; set; }       // only Tourist or Guide accepted
    [Required] public Gender? Gender { get; set; }
    [Required, MaxLength(80)] public string Country { get; set; } = string.Empty;
    [MaxLength(40)] public string PreferredLanguage { get; set; } = "English";

    // Guide-only (ignored for tourists)
    [MaxLength(2000)] public string? Bio { get; set; }
    public decimal? PricePerDay { get; set; }
    public List<string>? Languages { get; set; }
}

public class LoginRequest
{
    [Required, EmailAddress] public string Email { get; set; } = string.Empty;
    [Required] public string Password { get; set; } = string.Empty;
}

public class FirstAdminSetupRequest
{
    [Required, MaxLength(200)] public string SetupToken { get; set; } = string.Empty;
    [Required, MaxLength(120)] public string FullName { get; set; } = string.Empty;
    [Required, EmailAddress, MaxLength(256)] public string Email { get; set; } = string.Empty;
    [Required, MinLength(12), MaxLength(100)] public string Password { get; set; } = string.Empty;
}

public class UserDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string PreferredLanguage { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserDto User { get; set; } = null!;
}

// ---------- Governorates / Places ----------
public class GovernorateDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string DescriptionAr { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int PlacesCount { get; set; }
}

public class PlaceSummaryDto
{
    public int Id { get; set; }
    public int GovernorateId { get; set; }
    public string GovernorateName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string ShortDescriptionAr { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string? CoverImageUrl { get; set; }
}

public class PlaceImageDto
{
    public int Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public string? Caption { get; set; }
}

public class HistoricalEventDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public int? Year { get; set; }
    public string? Era { get; set; }
    public string Summary { get; set; } = string.Empty;
    public string SummaryAr { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public string DetailsAr { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
}

public class PlaceDetailDto : PlaceSummaryDto
{
    public string Description { get; set; } = string.Empty;
    public string DescriptionAr { get; set; } = string.Empty;
    public int StampRadiusMeters { get; set; }
    public string? SafetyNotes { get; set; }
    public string? SafetyNotesAr { get; set; }
    public string? CulturalTips { get; set; }
    public string? CulturalTipsAr { get; set; }
    public List<PlaceImageDto> Images { get; set; } = new();
    public List<HistoricalEventDto> HistoricalEvents { get; set; } = new();
    public bool HasStory { get; set; } // an on-site story unlocks with this place's stamp
}

// The story a stamp unlocks (GET /api/places/{id}/story).
public class PlaceStoryDto
{
    public int PlaceId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string LookFor { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string TextAr { get; set; } = string.Empty;
    public string LookForAr { get; set; } = string.Empty;
}

public class CreateHistoricalEventForm
{
    [Required, MaxLength(180)] public string Title { get; set; } = string.Empty;
    [MaxLength(180)] public string TitleAr { get; set; } = string.Empty;
    [Required] public EventType? EventType { get; set; }
    public int? Year { get; set; }
    [MaxLength(100)] public string? Era { get; set; }
    [Required, MaxLength(1000)] public string Summary { get; set; } = string.Empty;
    [MaxLength(1000)] public string SummaryAr { get; set; } = string.Empty;
    [Required, MaxLength(8000)] public string Details { get; set; } = string.Empty;
    [MaxLength(8000)] public string DetailsAr { get; set; } = string.Empty;
}

public class CreatePlaceRequest
{
    [Required] public int? GovernorateId { get; set; }
    [Required, MaxLength(160)] public string Name { get; set; } = string.Empty;
    [Required, MaxLength(160)] public string NameAr { get; set; } = string.Empty;
    [Required, MaxLength(500)] public string ShortDescription { get; set; } = string.Empty;
    [Required, MaxLength(500)] public string ShortDescriptionAr { get; set; } = string.Empty;
    [Required, MaxLength(8000)] public string Description { get; set; } = string.Empty;
    [Required, MaxLength(8000)] public string DescriptionAr { get; set; } = string.Empty;
    [Required] public PlaceCategory? Category { get; set; }
    [Required, Range(-90, 90)] public double? Latitude { get; set; }
    [Required, Range(-180, 180)] public double? Longitude { get; set; }
    [Range(25, 2000)] public int StampRadiusMeters { get; set; } = 150;
    [MaxLength(4000)] public string? SafetyNotes { get; set; }
    [MaxLength(4000)] public string? SafetyNotesAr { get; set; }
    [MaxLength(4000)] public string? CulturalTips { get; set; }
    [MaxLength(4000)] public string? CulturalTipsAr { get; set; }
    public IFormFile? CoverImage { get; set; }
    public List<IFormFile> Images { get; set; } = new();
    [Required, MinLength(1)] public List<CreateHistoricalEventForm> HistoricalEvents { get; set; } = new();
}

// ---------- Guides ----------
public class PlaceRefDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public int GovernorateId { get; set; }
}

public class GuideSummaryDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public decimal PricePerDay { get; set; }
    public double AvgRating { get; set; }
    public int ReviewsCount { get; set; }
    public List<string> Languages { get; set; } = new();
    public List<PlaceRefDto> Destinations { get; set; } = new();
}

public class ReviewDto
{
    public int Id { get; set; }
    public string TouristName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class GuideDetailDto : GuideSummaryDto
{
    public List<ReviewDto> Reviews { get; set; } = new();
    public string BookingInfo { get; set; } = string.Empty;
}

// A guide edits their own public profile (PUT /api/guides/me).
public class UpdateGuideProfileRequest
{
    [MaxLength(2000)] public string Bio { get; set; } = string.Empty;
    [Required, Range(0, 10000)] public decimal? PricePerDay { get; set; }
    [Required, MinLength(1), MaxLength(10)] public List<string> Languages { get; set; } = new();
    [MaxLength(60)] public List<int> PlaceIds { get; set; } = new(); // the places this guide takes visitors to
}

public class CreateReviewRequest
{
    [Required] public int? BookingId { get; set; }
    [Required, Range(1, 5)] public int? Rating { get; set; }
    [MaxLength(1000)] public string Comment { get; set; } = string.Empty;
}

// ---------- Bookings ----------
public class CreateBookingRequest
{
    [Required] public BookingType? Type { get; set; }
    public int? TripId { get; set; }
    public int? GuideUserId { get; set; }
    [Required] public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; } // required for guide bookings
}

public class BookingDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public int? TripId { get; set; }
    public string? TripTitle { get; set; }
    public int? GuideUserId { get; set; }
    public string? GuideName { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool CanReview { get; set; }
}

// A booking as the side that runs it sees it (a guide, or the Imshina team for trips): who asked, when, and for how much.
public class GuideBookingDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty; // Guide or Trip
    public int? TripId { get; set; }
    public string? TripTitle { get; set; }
    public string TouristName { get; set; } = string.Empty;
    public string TouristCountry { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public int Days { get; set; }
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class UpdateBookingStatusRequest
{
    [Required] public BookingStatus? Status { get; set; } // Confirmed, Cancelled or Completed
}

// ---------- Trips ----------
public class TripPlaceDto
{
    public int PlaceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public int OrderInDay { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

public class TripDayDto
{
    public int DayNumber { get; set; }
    public List<TripPlaceDto> Places { get; set; } = new();
}

public class TripDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DurationDays { get; set; }
    public decimal Price { get; set; }
    public string? CoverImageUrl { get; set; }
    public bool IsReadyMade { get; set; }
    public List<TripDayDto> Days { get; set; } = new();
}

public class TripDayRequest
{
    [Range(1, 30)] public int DayNumber { get; set; }
    [Required, MinLength(1), MaxLength(12)] public List<int> PlaceIds { get; set; } = new();
}

public class CreateCustomTripRequest
{
    [Required, MaxLength(120)] public string Title { get; set; } = string.Empty;
    [MaxLength(2000)] public string Description { get; set; } = string.Empty;
    [Required, MinLength(1), MaxLength(30)] public List<TripDayRequest> Days { get; set; } = new();
}

// ---------- Groups ----------
public class CreateGroupRequest
{
    [Required, MaxLength(120)] public string Name { get; set; } = string.Empty;
    [MaxLength(2000)] public string Description { get; set; } = string.Empty;
    [Required] public GroupGenderType? GenderType { get; set; }
    [Required, Range(2, 100)] public int? MaxMembers { get; set; }
    public int? TripId { get; set; }
    [Required] public DateOnly? StartDate { get; set; }
}

public class GroupDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string GenderType { get; set; } = string.Empty;
    public int MaxMembers { get; set; }
    public int CreatorId { get; set; }
    public string CreatorName { get; set; } = string.Empty;
    public int? TripId { get; set; }
    public string? TripTitle { get; set; }
    public DateOnly StartDate { get; set; }
    public int MembersCount { get; set; }      // creator + approved
    public string? MyStatus { get; set; }       // null if not requested / anonymous
}

public class GroupMemberDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
}

public class UpdateMemberRequest
{
    [Required] public MembershipStatus? Status { get; set; } // Approved or Rejected
}

// ---------- Stamps / Passport / Rewards ----------
public class CreateStampRequest
{
    [Required] public int? PlaceId { get; set; }
    [Required] public double? Lat { get; set; }
    [Required] public double? Lng { get; set; }
    [Required] public IFormFile Photo { get; set; } = null!;
}

public class UnlockedRewardDto
{
    public int RewardId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string PartnerName { get; set; } = string.Empty;
}

public class StampResponse
{
    public int StampId { get; set; }
    public int PlaceId { get; set; }
    public string PlaceName { get; set; } = string.Empty;
    public string PhotoUrl { get; set; } = string.Empty;
    public double DistanceMeters { get; set; }
    public int TotalStamps { get; set; }
    public List<UnlockedRewardDto> NewlyUnlockedRewards { get; set; } = new();
}

public class PassportStampDto
{
    public int StampId { get; set; }
    public int PlaceId { get; set; }
    public string PlaceName { get; set; } = string.Empty;
    public string PlaceNameAr { get; set; } = string.Empty;
    public string GovernorateName { get; set; } = string.Empty;
    public string PhotoUrl { get; set; } = string.Empty;
    public double DistanceMeters { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PassportDto
{
    public int TotalStamps { get; set; }
    public List<PassportStampDto> Stamps { get; set; } = new();
}

public class RewardDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string PartnerName { get; set; } = string.Empty;
    public string PartnerType { get; set; } = string.Empty;
    public int DiscountPercent { get; set; }
    public int RequiredStamps { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsUnlocked { get; set; }
}

// ---------- Insights (admin) ----------
// Aggregates only: no names, emails or photos of travellers leave the server.
public class InsightsDto
{
    public InsightsTotals Totals { get; set; } = new();
    public List<PlaceStat> Places { get; set; } = new();
    public List<NamedCount> Governorates { get; set; } = new();
    public List<NamedCount> Countries { get; set; } = new();
    public List<DayCount> Days { get; set; } = new();       // last 30 days, oldest first
    public int[] Weekdays { get; set; } = new int[7];        // stamps by day of week, Sunday first
}

public class InsightsTotals
{
    public int Stamps { get; set; }
    public int Travellers { get; set; }            // travellers with at least one stamp
    public int RegisteredTravellers { get; set; }
    public int Guides { get; set; }
    public int Bookings { get; set; }
    public int ConfirmedBookings { get; set; }
    public int CompletedBookings { get; set; }
    public int RewardsUnlocked { get; set; }
}

public class PlaceStat
{
    public int PlaceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string Governorate { get; set; } = string.Empty;
    public int Stamps { get; set; }
}

public class NamedCount
{
    public string Name { get; set; } = string.Empty;
    public string? NameAr { get; set; }
    public int Count { get; set; }
}

public class DayCount
{
    public DateOnly Date { get; set; }
    public int Count { get; set; }
}
