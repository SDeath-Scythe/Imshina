# Deploying Imshina

Imshina is two parts: the API (ASP.NET Core, SQLite) and the web app (static files built by Vite). Phones only allow GPS and the camera on **HTTPS**, so it has to be hosted before stamping can be shown on a real phone.

The steps below use [Render](https://render.com), because one Blueprint file (`render.yaml`) sets up both parts. Any host that runs a Docker container and serves static files works the same way.

## 1. Deploy with the Blueprint

1. Push the repo to GitHub (done).
2. In Render: **New → Blueprint**, choose this repo. Render reads `render.yaml` and proposes two services:
   - `imshina-api`: the API, built from `backend/TourIraq.Api/Dockerfile`
   - `imshina-web`: the web app, built from `frontend/`
3. Fill in `AdminSetup__Token` with a long random string (you'll use it once, to create the first admin), then **Apply**.
4. When both are live, open the web app's URL. The API URL and allowed origin in `render.yaml` assume the default service names. If Render gives you different URLs, update `VITE_API_URL` (web) and `Cors__Origins__0` (API), and redeploy both.

### Free plan vs. keeping data

On Render's free plan the API's disk is temporary: **every restart or redeploy starts from a fresh database**. Free services also go to sleep after about 15 minutes idle, and the first request after that takes up to a minute. The seed recreates the demo accounts and places on every start, so a demo still works. But stamps and accounts created during the demo disappear after the next restart.

To keep data, switch `imshina-api` to a paid plan and uncomment the `disk` block in `render.yaml` (mounted at `/data`). The database (`/data/touriraq.db`) and stamp photos (`/data/wwwroot/uploads`) live there.

## 2. Settings for production

| Setting (environment variable) | Value |
|---|---|
| `Jwt__Key` | long random string; the Blueprint generates one |
| `Cors__Origins__0` | the web app's exact address, e.g. `https://imshina-web.onrender.com` |
| `AdminSetup__Token` | long random string; open `/admin/setup` once to create the admin, then remove it |
| `Seed__Enabled` | `true` for demos; `false` for a real launch (also remove the demo accounts) |
| `DemoVenue__*` | see below |
| `VITE_API_URL` (web, build time) | the API address ending in `/api` |
| `VITE_DEMO` (web, build time) | `true` shows the demo login buttons |

## 3. Live demo checklist (stamping on stage)

Judges won't be standing at the Ishtar Gate, so add a **demo stamp at the venue**:

1. At the venue, open Google Maps, long-press where you'll stand, and copy the coordinates.
2. In the API service, set:
   ```
   DemoVenue__Enabled=true
   DemoVenue__Latitude=<lat>
   DemoVenue__Longitude=<lng>
   DemoVenue__RadiusMeters=200
   ```
   Optional: `DemoVenue__Name`, `DemoVenue__NameAr`, `DemoVenue__Governorate` (default Baghdad).
3. Redeploy the API. "Imshina demo stamp" now appears in the list of places. On stage: open it, tap **Collect your stamp**, take a photo, and show the stamp and the share card.
4. After the event, set `DemoVenue__Enabled=false`. On the next start the demo place and its stamps are removed.

Also before the demo:
- Open the web app on the demo phone, add it to the home screen and log in once.
- Check that location and camera are allowed for the site in the phone's settings.
- Wake the free API a few minutes before you present (open any page), so the first tap isn't slow.
- Put a QR code to the web app on your last slide.

## 4. Other hosts

- **Web app on Vercel or Netlify:** root `frontend`, build `npm run build`, output `dist`, and set `VITE_API_URL`. `frontend/vercel.json` already sends every path to `index.html`.
- **API anywhere Docker runs** (Azure Container Apps, Fly.io, Railway, a VPS):
  ```bash
  cd backend/TourIraq.Api
  docker build -t imshina-api .
  docker run -p 8080:8080 -v imshina-data:/data \
    -e Jwt__Key="<32+ random characters>" \
    -e Cors__Origins__0="https://your-web-app" \
    imshina-api
  ```
  Put HTTPS in front of it (most hosts do this for you).
