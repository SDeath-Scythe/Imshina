using Microsoft.EntityFrameworkCore;
using TourIraq.Api.Models;

namespace TourIraq.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<GuideProfile> GuideProfiles => Set<GuideProfile>();
    public DbSet<GuideLanguage> GuideLanguages => Set<GuideLanguage>();
    public DbSet<GuidePlace> GuidePlaces => Set<GuidePlace>();
    public DbSet<GuideReview> GuideReviews => Set<GuideReview>();
    public DbSet<Governorate> Governorates => Set<Governorate>();
    public DbSet<Place> Places => Set<Place>();
    public DbSet<PlaceImage> PlaceImages => Set<PlaceImage>();
    public DbSet<HistoricalEvent> HistoricalEvents => Set<HistoricalEvent>();
    public DbSet<Trip> Trips => Set<Trip>();
    public DbSet<TripPlace> TripPlaces => Set<TripPlace>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<TourGroup> TourGroups => Set<TourGroup>();
    public DbSet<GroupMember> GroupMembers => Set<GroupMember>();
    public DbSet<Stamp> Stamps => Set<Stamp>();
    public DbSet<Partner> Partners => Set<Partner>();
    public DbSet<Reward> Rewards => Set<Reward>();

    protected override void ConfigureConventions(ModelConfigurationBuilder b)
    {
        // Store every enum as a readable string.
        b.Properties<UserRole>().HaveConversion<string>();
        b.Properties<Gender>().HaveConversion<string>();
        b.Properties<PlaceCategory>().HaveConversion<string>();
        b.Properties<EventType>().HaveConversion<string>();
        b.Properties<BookingType>().HaveConversion<string>();
        b.Properties<BookingStatus>().HaveConversion<string>();
        b.Properties<GroupGenderType>().HaveConversion<string>();
        b.Properties<MembershipStatus>().HaveConversion<string>();
        b.Properties<PartnerType>().HaveConversion<string>();
    }

    protected override void OnModelCreating(ModelBuilder m)
    {
        m.Entity<User>(e =>
        {
            e.Property(x => x.FullName).HasMaxLength(120).IsRequired();
            e.Property(x => x.Email).HasMaxLength(256).IsRequired();
            e.HasIndex(x => x.Email).IsUnique();
            e.HasIndex(x => x.Role).IsUnique().HasFilter("\"Role\" = 'Admin'");
        });

        m.Entity<GuideProfile>(e =>
        {
            e.HasKey(x => x.UserId);
            e.HasOne(x => x.User).WithOne(u => u.GuideProfile)
                .HasForeignKey<GuideProfile>(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        m.Entity<GuideLanguage>(e =>
        {
            e.HasKey(x => new { x.GuideUserId, x.Language });
            e.Property(x => x.Language).HasMaxLength(40);
            e.HasOne(x => x.Guide).WithMany(g => g.Languages)
                .HasForeignKey(x => x.GuideUserId).OnDelete(DeleteBehavior.Cascade);
        });

        m.Entity<GuidePlace>(e =>
        {
            e.HasKey(x => new { x.GuideUserId, x.PlaceId });
            e.HasOne(x => x.Guide).WithMany(g => g.Places)
                .HasForeignKey(x => x.GuideUserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Place).WithMany(p => p.GuidePlaces)
                .HasForeignKey(x => x.PlaceId).OnDelete(DeleteBehavior.Cascade);
        });

        m.Entity<GuideReview>(e =>
        {
            e.HasOne(x => x.Guide).WithMany(g => g.Reviews)
                .HasForeignKey(x => x.GuideUserId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Tourist).WithMany()
                .HasForeignKey(x => x.TouristId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Booking).WithMany()
                .HasForeignKey(x => x.BookingId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.BookingId).IsUnique(); // one review per booking
        });

        m.Entity<Governorate>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(80).IsRequired();
            e.HasIndex(x => x.Name).IsUnique();
        });

        m.Entity<Place>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(160).IsRequired();
            e.HasOne(x => x.Governorate).WithMany(g => g.Places)
                .HasForeignKey(x => x.GovernorateId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => new { x.GovernorateId, x.Category });
        });

        m.Entity<PlaceImage>(e =>
            e.HasOne(x => x.Place).WithMany(p => p.Images)
                .HasForeignKey(x => x.PlaceId).OnDelete(DeleteBehavior.Cascade));

        m.Entity<HistoricalEvent>(e =>
            e.HasOne(x => x.Place).WithMany(p => p.HistoricalEvents)
                .HasForeignKey(x => x.PlaceId).OnDelete(DeleteBehavior.Cascade));

        m.Entity<Trip>(e =>
        {
            e.HasOne(x => x.Owner).WithMany()
                .HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => new { x.IsReadyMade, x.OwnerId });
        });

        m.Entity<TripPlace>(e =>
        {
            e.HasKey(x => new { x.TripId, x.DayNumber, x.OrderInDay });
            e.HasIndex(x => new { x.TripId, x.PlaceId }).IsUnique();
            e.HasOne(x => x.Trip).WithMany(t => t.TripPlaces)
                .HasForeignKey(x => x.TripId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Place).WithMany()
                .HasForeignKey(x => x.PlaceId).OnDelete(DeleteBehavior.Restrict);
        });

        m.Entity<Booking>(e =>
        {
            e.HasOne(x => x.User).WithMany()
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Trip).WithMany()
                .HasForeignKey(x => x.TripId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.GuideUser).WithMany()
                .HasForeignKey(x => x.GuideUserId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.GuideUserId);
        });

        m.Entity<TourGroup>(e =>
        {
            e.HasOne(x => x.Creator).WithMany()
                .HasForeignKey(x => x.CreatorId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Trip).WithMany()
                .HasForeignKey(x => x.TripId).OnDelete(DeleteBehavior.SetNull);
        });

        m.Entity<GroupMember>(e =>
        {
            e.HasKey(x => new { x.GroupId, x.UserId }); // prevents duplicate requests
            e.HasOne(x => x.Group).WithMany(g => g.Members)
                .HasForeignKey(x => x.GroupId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User).WithMany()
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        m.Entity<Stamp>(e =>
        {
            e.HasIndex(x => new { x.UserId, x.PlaceId }).IsUnique(); // one stamp per tourist per place
            e.HasOne(x => x.User).WithMany()
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Place).WithMany()
                .HasForeignKey(x => x.PlaceId).OnDelete(DeleteBehavior.Restrict);
        });

        m.Entity<Partner>(e =>
            e.HasOne(x => x.Governorate).WithMany()
                .HasForeignKey(x => x.GovernorateId).OnDelete(DeleteBehavior.Restrict));

        m.Entity<Reward>(e =>
        {
            e.HasOne(x => x.Partner).WithMany(p => p.Rewards)
                .HasForeignKey(x => x.PartnerId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.RequiredStamps);
        });
    }
}
