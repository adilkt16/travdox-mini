# Layover Passport 🛂

> **"Your passport, but you actually want to fill it."**

A PWA travel tracker styled like a real physical passport. Tick countries on a 3D globe, hold to press ink stamps for local finds, swap passport codes with friends.

**Built for:** Layover 2026 hackathon · No backend · localStorage only · Vercel static deploy

---

## Tech Stack

React + Vite + Tailwind + `vite-plugin-pwa` · `globe.gl` · HashRouter · no API keys

## Three Tabs

| Tab | What it does |
|---|---|
| **ATLAS** | 3D matte globe · search · tap country → ticket-stub slip → hold-to-stamp entry |
| **PASSPORT** | Swipeable stamped pages, holder data, MRZ zone |
| **EXCHANGE** | Generate/share `LC1.<base64url>` code · paste friend's code · Customs Desk compare |

## Key Interactions

- **Hold-to-stamp (600 ms):** ink ring fills → stamp slams in (scale 1.35→1, 2° overshoot) → page shake 2px → `vibrate([18,40,12])` → WebAudio thump (synthesized, no file) → "RARE FIND" / "LEGENDARY" overstamp banner
- **Globe:** matte old-atlas style, slow auto-rotate, visited countries colored by rarity ink, stops on touch
- **Onboarding:** closed passport cover (oxblood + gold foil) → 3D flip open → typewriter-form issue page → home country auto-stamped

## Design System (non-negotiable)

**Colors:** Paper `#F1E8D2` · Ink navy `#1C2B4B` · Cover oxblood `#5A1F26` · Gold foil `#A57F2C→#F2DC8A→#C9A24B` · Stamp inks: blue `#2A4B9B`, red `#B23A2B`, green `#2F6B4F`, violet `#5B3F8C`

**Fonts (Google Fonts, exactly 4):** IM Fell English (headings) · Source Serif 4 (body) · Special Elite (fields/labels) · Big Shoulders Display (stamp text)

**Texture:** SVG `feTurbulence` paper grain (no image files) · Stamps are SVG with `feTurbulence + feDisplacementMap` rough ink edges · `mix-blend-mode: multiply` · random tilt seeded by ID

**Banned:** glassmorphism · Inter/Roboto/system fonts · emoji icons · confetti · purple/blue/pink gradients · generic card grids · default Tailwind colors

## Data Shape (localStorage)

```js
passport:    { name, home, no, issuedAt }
visited:     { "IN": "2026-10-11", ... }
finds:       { "IN-halwa": "2026-10-11", ... }
customFinds: { "IN": [{ id, title }] }
```

**Share code:** `LC1.<base64url>` → version + name (≤20 chars) + home iso2 + visited bitset over fixed COUNTRIES array + find counts. Link: `/#/x/<code>`

## Seeded Finds

12 countries have 8 finds each (5 common / 2 rare / 1 legendary): `IN AE JP FR TH ID IT GB US SG TR MY`. Must be real, specific, well-known places/items. India includes Kerala/Kozhikode items.

## Critical Rules

- `COUNTRIES` array in `src/data/countries.js` → **NEVER reorder**
- Natural Earth GeoJSON: France & Norway have `ISO_A2 = -99` → use `ISO_A2_EH` or `ADM0_A3`
- All localStorage reads/writes in `try/catch`
- Mobile-first 390px · Desktop = centered 480px column
- No backend, no login, no database — ever

## Out of Scope (do not build)

Login · database · leaderboard · chat · notifications · photo verification · bucket list · settings · dark mode · onboarding tour

---

*Built overnight at LAYOVER 2026*
