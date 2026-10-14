namespace TourIraq.Api.Models;

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty; // always stored lower-case + trimmed
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public Gender Gender { get; set; }
    public string Country { get; set; } = string.Empty;
    public string PreferredLanguage { get; set; } = "English";
    public string? ProfilePhotoUrl { get; set; }
    public bool IsVerified { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public GuideProfile? GuideProfile { get; set; }
}
