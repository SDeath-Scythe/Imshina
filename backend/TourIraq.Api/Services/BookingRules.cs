using TourIraq.Api.Models;

namespace TourIraq.Api.Services;

/// <summary>
/// Which status changes the side that runs a booking may make (a guide for guide bookings, the Imshina team for trips).
/// Pending → Confirmed (accept, until the start date) · Pending → Cancelled (decline) ·
/// Confirmed → Cancelled (before the start date) · Confirmed → Completed (from the last day).
/// </summary>
public static class BookingRules
{
    /// <returns>null when the change is allowed, otherwise (status code, title, detail) for a ProblemDetails reply.</returns>
    public static (int Status, string Title, string Detail)? CheckProviderChange(Booking booking, BookingStatus to, DateOnly today)
    {
        var from = booking.Status;
        switch (to)
        {
            case BookingStatus.Confirmed:
                if (from != BookingStatus.Pending)
                    return (409, "Already decided", $"This booking is already {from}.");
                if (booking.StartDate < today)
                    return (409, "Too late", "The start date has passed, so this request can only be declined.");
                return null;

            case BookingStatus.Cancelled:
                if (from == BookingStatus.Confirmed && booking.StartDate <= today)
                    return (409, "Already started", "A booking can't be cancelled on or after its start date.");
                if (from != BookingStatus.Pending && from != BookingStatus.Confirmed)
                    return (409, "Already decided", $"This booking is already {from}.");
                return null;

            case BookingStatus.Completed:
                if (from != BookingStatus.Confirmed)
                    return (409, "Not confirmed", "Only a confirmed booking can be marked as completed.");
                if (booking.EndDate > today)
                    return (409, "Not finished yet", "A booking can be marked as completed from its last day.");
                return null;

            default:
                return (400, "Invalid status", "Status must be Confirmed, Cancelled or Completed.");
        }
    }
}
