using System.Security.Claims;

namespace TourIraq.Api.Services;

public static class ClaimsExtensions
{
    // JWT inbound claim mapping is disabled, so the user id lives in the "sub" claim.
    public static int? GetUserId(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirst("sub")?.Value;
        return int.TryParse(value, out var id) ? id : null;
    }
}
