# Google Maps integration — setup & architecture

AgriSmart 2.0 uses the **Google Maps Platform** for the Smart Map, location
search, geocoding and directions. The integration is **environment-driven**:
with a key configured you get live Google tiles, Places Autocomplete,
reverse-geocoding and Directions API routes; without one the app degrades to a
clearly-labelled interactive **demo map** with sample locations and never
breaks.

---

## 1. Add the API key (2 minutes)

```bash
# agrismart/.env.local   (and/or repo-root .env.local)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
```

Then restart the dev server (`npm run dev`) or redeploy on Vercel
(Project → Settings → Environment Variables → add the same name/value).

> `NEXT_PUBLIC_*` values are inlined into the client bundle at build time by
> Next.js. Nothing else in the codebase may contain a key — `npm run
> guard:secrets` and `npm run check:staged` fail the build if a key value is
> ever committed.

### Where the key is read

`lib/googleMaps.ts` → `process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, exposed
only through `mapsApiKey()` / `isMapsConfigured()`. Placeholder values
(`your-key`, `xxx…`) are treated as *unconfigured* so a half-finished `.env`
still falls back cleanly.

## 2. Enable exactly these APIs

In Google Cloud Console → **APIs & Services → Library**:

| API | Used for |
|---|---|
| **Maps JavaScript API** | interactive map, custom markers, DirectionsService route drawing |
| **Places API** | Autocomplete in every search box ("Vijayawada", "veterinary hospital near me") |
| **Geocoding API** | reverse-geocode a picked farm / product pin into a readable address |

Nothing else is required. The **"Open in Google Maps"** buttons use the
keyless `https://www.google.com/maps/dir/?api=1&…` URL scheme, so turn-by-turn
navigation works even in demo mode.

## 3. Restrict the key (do this before any public demo)

1. **Application restrictions → HTTP referrers (web sites)**
   - `localhost:3000/*`
   - `127.0.0.1:3000/*`
   - `agrismart-two-neon.vercel.app/*`
   - your production domain `/*`
2. **API restrictions → Restrict key** → tick only the three APIs above.
3. **Quotas & budgets**: set a daily quota (e.g. 1 000 map loads) and a budget
   alert in Cloud Console → Billing.

A browser key is always public — referrer + API restrictions are what keep it
safe. Never put a *server* credential (Supabase service key, Vercel token)
anywhere near the Maps code.

## 4. Architecture

```
lib/geo.ts                 haversine, distance/time formatting, keyless Maps URLs, bounds
lib/googleMaps.ts          key access, script loader (cached), emoji marker SVGs, geocode/reverse
lib/places.ts              sample dataset: 11 categories × full location block (lat, lng,
                           address, city, district, state, postal_code) + queries + localStorage pins
components/maps/
  useGoogleMaps.ts         resolves the JS API once → 'unconfigured' | 'loading' | 'ready' | 'error'
  MapCanvas.tsx            THE map surface: GoogleMapView when ready, DemoMapView otherwise
  GoogleMapView.tsx        real API: emoji markers, camera pans, bounce, DirectionsRenderer
  DemoMapView.tsx          labelled interactive fallback (pan/zoom/click-to-place), "DEMO MAP" badge
  PlaceSearch.tsx          Places Autocomplete ⇄ offline suggestions fallback
  PlaceInfoCard.tsx        marker information card (View Details / Directions / Book / Call)
  DirectionsPanel.tsx      origin→destination distance & time (API or labelled estimate)
  LocationPickerModal.tsx  farm / product pin picker: search + tap-map + GPS + reverse geocode
  NearbyServices.tsx       reusable "nearby" cards used by 10+ pages
  MapConfigureModal.tsx    in-app version of this document
app/(app)/map/page.tsx     Smart Map: filters, categories, nearby chooser, sheets, deep links
```

### Deep links (how the map stops feeling like a separate feature)

- `/map?focus=<placeId>` — open with a marker selected (`g-mc1`, `g-vt2`, `land-01`, …)
- `/map?focus=<placeId>&route=1` — same, with the route from your location drawn
- `/map?lat=…&lng=…&label=…` — pin an arbitrary coordinate (marketplace sellers)
- `/map?lat=…&lng=…&route=1` — arbitrary coordinate + route

Every machinery card, market row, expert, government service, dairy/poultry/
aqua service and marketplace listing links through these.

### Demo mode honesty rules

- The fallback map carries a permanent **"DEMO MAP — Google Maps not
  configured"** badge.
- All sample places are labelled `◆ Demo data` wherever they appear.
- Distances without the Directions API are **estimates** (straight-line × 1.25
  road factor) and say so in the UI.
- No real-time availability is claimed anywhere.

## 5. Database schema

Location-enabled records carry the full block (see
`supabase/migrations/0002_location_fields.sql`):

```
latitude  double precision
longitude double precision
address   text
city      text
district  text
state     text
postal_code text
```

applied to `farms`, `machinery`, `marketplace_listings`, `experts`, `markets`,
`service_providers` and `government_services`, plus a GiST-friendly plain
index for radius queries. The demo dataset in `lib/places.ts` mirrors this
shape exactly, so swapping in live Supabase queries is a drop-in change.

## 6. Verifying the integration

```bash
npm run build
node scripts/intro-audit.js http://127.0.0.1:3000/   # unrelated intro regression
# manual: open /map, /farm, /agrirent, /marketplace — demo badge visible,
# filters, picker, directions and deep links all work with no key.
```

With a key set, the badge flips to **"Google Maps live"**, the search box
becomes Places Autocomplete and DirectionsPanel shows API distance/duration.
