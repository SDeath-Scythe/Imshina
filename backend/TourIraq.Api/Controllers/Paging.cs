namespace TourIraq.Api.Controllers;

public static class Paging
{
    public const int MaxPageSize = 50;

    public static (int Page, int PageSize) Clamp(int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);
        return (page, pageSize);
    }
}
