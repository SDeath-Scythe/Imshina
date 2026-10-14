# Place coordinates

Every place has a stamp zone: a circle around its coordinates. If the coordinates are wrong, travellers standing at the real site are told they're too far away. The first seed used rough positions, and in October 2026 each one was checked against public sources. Twelve of the 18 were more than 100 m off, and Al-Ukhaidir was more than 4 km off.

The API corrects these on every start (`FixPlaceCoordinatesAsync` in `Data/SeedData.cs`), so older databases are fixed too.

| Place | Now | Moved by | Source | Status |
|---|---|---|---|---|
| Al-Kadhimiya Shrine | 33.3800, 44.3381 | 366 m | Wikipedia: Al-Kazimiyya Mosque | verified |
| Al-Mustansiriya School | 33.3385, 44.3896 | 256 m | Wikipedia: Mustansiriyya Madrasa | verified |
| Abbasid Palace | 33.3431, 44.3835 | 754 m | Wikipedia: Abbasid Palace | verified |
| Al-Mutanabbi Street | 33.3414, 44.3866 | 0 m | no source found | unverified |
| Iraq National Museum | 33.3283, 44.3854 | 1,184 m | Arabic Wikipedia: المتحف العراقي | verified |
| Imam Ali Shrine | 31.9959, 44.3146 | 490 m | Wikipedia: Imam Ali Shrine | verified |
| Wadi al-Salam Cemetery | 32.0172, 44.2975 | 835 m | Wikipedia: Wadi-us-Salaam | verified |
| Great Mosque of Kufa | 32.0286, 44.4008 | 115 m | Wikipedia: Great Mosque of Kufa | verified |
| Najaf Old City | 31.9959, 44.3146 | 555 m | centred on the Imam Ali Shrine, radius raised to 450 m | estimated |
| Imam Husayn Shrine | 32.6164, 44.0325 | 0 m | Wikipedia: Imam Husayn Shrine | verified |
| Al-Abbas Shrine | 32.6172, 44.0362 | 592 m | Wikipedia: Al-Abbas Shrine | verified |
| Al-Ukhaidir Fortress | 32.4377, 43.6013 | 4,358 m | latitude.to (single source) | check on a map |
| Ancient City of Babylon | 32.5425, 44.4211 | 680 m | Wikipedia: Babylon | verified |
| Ishtar Gate (Reconstruction) | 32.5433, 44.4223 | 234 m | Vici.org: Ishtar Gate (original position; the replica stands beside it) | verified |
| Nebuchadnezzar's Southern Palace | 32.5428, 44.4205 | 756 m | estimated: the palace is directly west of the Ishtar Gate | estimated |
| Lion of Babylon | 32.5450, 44.4213 | 754 m | Vici.org: Babylon, Lion (±5 m) | verified |
| Borsippa (Birs Nimrud) | 32.3920, 44.3417 | 1,062 m | Wikipedia: Borsippa | verified |
| Kish (Tell Uhaimir) | 32.5403, 44.6047 | 1,794 m | Wikipedia: Kish (whole site, not Tell Uhaimir alone) | check on a map |

**Status:**
- **verified:** taken from the source shown.
- **estimated:** no direct source; placed from a nearby verified landmark.
- **check on a map:** one source only, or the source describes a larger area than the place name.
- **unverified:** unchanged, no source found.

## Before a live demo or launch

Open each place that isn't **verified** in a satellite map (Google Maps or OpenStreetMap), drop a pin on the spot a visitor actually stands, and update both the `P(...)` call and `CheckedCoordinates` in `Data/SeedData.cs`. Better still, stand at the site and use **Check** on the place page, which shows your distance from the stored point.

Large sites (Babylon, Borsippa, Kish, Al-Ukhaidir, Wadi al-Salam) use 300–500 m zones, so small errors there matter less.
