using Microsoft.EntityFrameworkCore;
using TourIraq.Api.Models;

namespace TourIraq.Api.Data;

/// <summary>
/// An optional extra place at the venue of a live demo (a hackathon hall, a pitch room),
/// so a real GPS-checked stamp can be collected on stage. Configured under "DemoVenue" in appsettings.
/// Turned off by default. When it's turned off again, the place is removed together with its stamps.
/// </summary>
public static class DemoVenue
{
    public static async Task ApplyAsync(AppDbContext db, IConfiguration config)
    {
        var section = config.GetSection("DemoVenue");
        var name = section["Name"];
        if (string.IsNullOrWhiteSpace(name)) return;

        var existing = await db.Places.FirstOrDefaultAsync(p => p.Name == name);

        if (!section.GetValue("Enabled", false))
        {
            if (existing is not null)
            {
                db.Stamps.RemoveRange(db.Stamps.Where(s => s.PlaceId == existing.Id));
                db.Places.Remove(existing);
                await db.SaveChangesAsync();
            }
            return;
        }

        var lat = section.GetValue<double?>("Latitude");
        var lng = section.GetValue<double?>("Longitude");
        if (lat is null || lng is null || lat is < -90 or > 90 || lng is < -180 or > 180)
            throw new InvalidOperationException("DemoVenue:Latitude and DemoVenue:Longitude must be set when DemoVenue:Enabled is true.");

        var radius = Math.Clamp(section.GetValue("RadiusMeters", 200), 25, 2000);
        var govName = section["Governorate"] ?? "Baghdad";
        var governorate = await db.Governorates.FirstOrDefaultAsync(g => g.Name == govName)
            ?? await db.Governorates.OrderBy(g => g.Id).FirstOrDefaultAsync();
        if (governorate is null) return; // nothing seeded yet

        var place = existing ?? new Place { Name = name };
        place.Governorate = governorate;
        place.NameAr = section["NameAr"] ?? name;
        place.Category = PlaceCategory.Other;
        place.Latitude = lat.Value;
        place.Longitude = lng.Value;
        place.StampRadiusMeters = radius;
        place.ShortDescription = section["ShortDescription"] ?? "Demo stamp for today's event. Collect it here to see how a heritage stamp works.";
        place.ShortDescriptionAr = section["ShortDescriptionAr"] ?? "ختم تجريبي لفعالية اليوم. اجمعه هنا لترى كيف يعمل ختم المواقع التراثية.";
        place.Description = section["Description"] ?? "This place exists only for a live demonstration. At a real heritage site the same check runs: your phone must be inside the stamp zone, and the server confirms the distance before the stamp is added.";
        place.DescriptionAr = section["DescriptionAr"] ?? "هذا المكان مخصص للعرض المباشر فقط. في المواقع التراثية الحقيقية يجري الفحص نفسه: يجب أن يكون هاتفك داخل منطقة الختم، ويتحقق الخادم من المسافة قبل إضافة الختم.";

        if (existing is null) db.Places.Add(place);
        await db.SaveChangesAsync();
    }
}
