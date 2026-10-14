# Roadmap

What's built, what still needs checking, and what's next, in rough priority order. Each item says why it matters and what it needs, so it can be picked up without extra context.

## Needs checking first

### 1. Build and test the backend
The API code added in October 2026 was written without a .NET compiler at hand. Run `dotnet build`, then click through each feature with the real API:
- `Controllers/GuideBookingsController.cs` and the cancel action in `Controllers/BookingsController.cs` (booking inbox and cancelling)
- `Controllers/AdminInsightsController.cs` and the insights DTOs at the end of `DTOs/Dtos.cs`
- `Data/DemoVenue.cs` and its call in `Program.cs`
- `FixPlaceCoordinatesAsync` in `Data/SeedData.cs`
- `Data/OnSiteStories.cs`, `Controllers/PlaceStoriesController.cs`, and `HasStory` on the place detail (`Controllers/PlacesController.cs`, `DTOs/Dtos.cs`)

None of these change the database schema, so no migration is needed.

### 2. Check the remaining coordinates
Twelve places were corrected from public sources. Six still need a look on a satellite map, or better, on site: Al-Mutanabbi Street, Najaf Old City, Al-Ukhaidir Fortress, the Southern Palace, Kish and the Ishtar Gate replica. See [PLACES.md](PLACES.md).

### 3. Deploy and rehearse the demo
Follow [DEPLOY.md](DEPLOY.md), set up the venue demo stamp, and rehearse on the phone you'll present with.

## Next features

### 4. Real photos of the places
**Why:** place cards show category icons, and photos are the first thing people notice.
**How:** pick freely licensed photos from Wikimedia Commons (search the place name; use photos of the site in Iraq, not museum pieces abroad). Set `CoverImageUrl` for each place in `Data/SeedData.cs`, or upload through the admin form. Record the author and licence of each photo in a `docs/PHOTO_CREDITS.md`, and show credits on the place page. A `PhotoCredit` column needs a migration.
**Already done:** if a photo URL fails to load, the app falls back to the category tile.

### 5. On-site stories: next steps
**Done:** each of the 18 places has a short story (a surprising fact, plus one thing to look for), in English and Arabic, taken from each site's Wikipedia article. It's shown on the stamp-collected screen, on the place page and in the passport. The API only sends it to travellers who hold that place's stamp (`GET /api/places/{id}/story`). Before the stamp, the place page shows a locked note.
**Next:**
- Have the texts reviewed by someone who knows each site.
- Add audio versions.
- Let admins write stories for new places. The stories live in code (`Data/OnSiteStories.cs`), so editing them from the admin form needs `OnSiteStory` columns (a migration).

### 6. Partner reward redemption
**Why:** today a traveller shows a coupon code, but the partner can't verify it or mark it used. Verification is what makes partners willing to pay, which is the business model.
**How:**
- Add a `Redemption` table (user, reward, time, partner) and a `Partner` login role, or a per-partner PIN.
- The reward page shows a QR code with a short-lived signed token.
- The partner scans it on a simple partner page, which marks it used once.
- Add redemptions to the insights page.

### 7. Tag along: finish it
**Why:** the idea is meeting other travellers. Right now people can only join groups.
**Needs:**
- a "who's heading where this week" view (groups filtered by city and date can be done in the frontend);
- group messages (a `Message` table plus polling, or SignalR);
- **report and block** (`Report` and `Block` tables, plus an admin review queue);
- a verified badge.

Safety tools must ship before anything that shows strangers to each other, especially for women-only groups.

### 8. Ready-made trips need an owner
Trip bookings stay pending because nobody can confirm them. Give trips an owning agency (`Trip.AgencyUserId`, migration) and reuse the guide inbox for agencies.

### 9. Notifications
Updates are only seen when the app is opened. Add web push (a service worker and VAPID keys) for booking decisions, group approvals and new guide requests, with email as a fallback.

### 10. Offline mode
Signal is weak at remote sites. A service worker can cache the app shell, places and the passport. Stamps still need the server: either show "will send when you're back online", queueing the photo and location with a timestamp and accepting a weaker anti-cheat check, or keep stamping online-only.

### 11. Accounts
Forgot password (needs an email provider and reset tokens), account deletion, editing the profile.

### 12. Payments
Qi Card or ZainCash for guide and trip bookings. Today, travellers pay on the day.

## Hardening before a public launch
- Move login tokens from `localStorage` to httpOnly cookies with refresh tokens.
- Rate-limit login, registration and stamping.
- Stronger anti-cheating: compare the photo's capture time with the upload time, flag the same photo used twice, flag impossible travel between stamps.
- `Seed:Enabled=false`, demo accounts removed, a real `Jwt:Key`, the admin setup token removed after use.
- Insights at scale: move the grouping into SQL or a nightly summary table; add a date range and CSV export.
- Automated tests: xUnit for the API rules (bookings, stamps, groups), and Playwright for the main flows against a test API.
- Re-check every fact on the **Before you go** page (`frontend/src/data/practical.js`) before each release; visa rules and travel advice change often.
