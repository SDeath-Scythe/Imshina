namespace TourIraq.Api.Services;

public class FileStorageService
{
    private const long MaxBytes = 5 * 1024 * 1024; // 5 MB
    private readonly string _uploadsDir;

    public FileStorageService(IWebHostEnvironment env)
    {
        var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        _uploadsDir = Path.Combine(webRoot, "uploads");
        Directory.CreateDirectory(_uploadsDir);
    }

    /// Validates the image (size + real content signature), stores it under a random name,
    /// and returns the relative URL. The client filename is never used.
    public async Task<(string? Url, string? Error)> SaveImageAsync(IFormFile? file, CancellationToken ct)
    {
        if (file is null || file.Length == 0) return (null, "A photo is required.");
        if (file.Length > MaxBytes) return (null, "Photo must be 5 MB or smaller.");

        var header = new byte[12];
        await using (var probe = file.OpenReadStream())
        {
            var read = await probe.ReadAsync(header.AsMemory(0, header.Length), ct);
            if (read < header.Length) return (null, "File is not a valid image.");
        }

        var ext = DetectExtension(header);
        if (ext is null) return (null, "Only JPEG, PNG or WebP images are allowed.");

        var fileName = $"{Guid.NewGuid():N}{ext}";
        var fullPath = Path.Combine(_uploadsDir, fileName);

        await using (var target = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write))
        await using (var source = file.OpenReadStream())
        {
            await source.CopyToAsync(target, ct);
        }

        return ($"/uploads/{fileName}", null);
    }

    public void Delete(string? relativeUrl)
    {
        if (string.IsNullOrEmpty(relativeUrl) || !relativeUrl.StartsWith("/uploads/")) return;
        var name = Path.GetFileName(relativeUrl); // strips any path segments
        var path = Path.Combine(_uploadsDir, name);
        try { if (File.Exists(path)) File.Delete(path); } catch { /* best effort */ }
    }

    private static string? DetectExtension(byte[] h)
    {
        if (h[0] == 0xFF && h[1] == 0xD8 && h[2] == 0xFF) return ".jpg";
        if (h[0] == 0x89 && h[1] == 0x50 && h[2] == 0x4E && h[3] == 0x47) return ".png";
        if (h[0] == 'R' && h[1] == 'I' && h[2] == 'F' && h[3] == 'F' &&
            h[8] == 'W' && h[9] == 'E' && h[10] == 'B' && h[11] == 'P') return ".webp";
        return null;
    }
}
