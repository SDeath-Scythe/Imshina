namespace TourIraq.Api.Services;

public class GeoService
{
    private const double EarthRadiusMeters = 6_371_000;

    public static bool IsValidCoordinate(double lat, double lng) =>
        !double.IsNaN(lat) && !double.IsNaN(lng) &&
        lat is >= -90 and <= 90 && lng is >= -180 and <= 180;

    // Haversine great-circle distance in meters.
    public double DistanceMeters(double lat1, double lon1, double lat2, double lon2)
    {
        static double Rad(double d) => d * Math.PI / 180.0;
        var dLat = Rad(lat2 - lat1);
        var dLon = Rad(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(Rad(lat1)) * Math.Cos(Rad(lat2)) * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return EarthRadiusMeters * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }
}
