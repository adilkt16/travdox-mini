# PROJECT SPEC — Layover Passport (Compressed)

## Identity
- App: PWA passport-style travel tracker
- Pitch: "Your passport, but you actually want to fill it."
- Stack: React + Vite + Tailwind (defaults replaced) + vite-plugin-pwa + globe.gl + HashRouter
- Deploy: Vercel static. No backend, no API keys, no database, no login.
- State: localStorage only. All reads/writes in try/catch.

---

## Scope IN
1. Onboarding: closed passport cover → 3D flip open → typewriter issue form (name, home country, auto-generated no like `LC-4821`) → home country auto-stamped
2. ATLAS tab: 3D matte globe, search, tap → ticket-stub slip, hold-to-stamp entry
3. Country page: entry stamp + 8 seeded finds (12 countries) + add-your-own for the rest
4. PASSPORT tab: swipeable scroll-snap pages, holder data + MRZ, stamps scattered/tilted
5. EXCHANGE tab: generate/share code + paste friend's code + Customs Desk compare + sample passports
6. Installable PWA

## Scope OUT (never build)
Login, database, leaderboard, chat, photo verification, bucket list, settings, dark mode, onboarding tour, confetti, AI generation (stretch only)

---

## Design System

### Colors
| Token | Value |
|---|---|
| Paper | `#F1E8D2` |
| Paper shadow | `#E4D7B8` |
| Ink (all text) | `#1C2B4B` |
| Cover oxblood | `#5A1F26` |
| Gold foil | `#A57F2C → #F2DC8A → #C9A24B` |
| Stamp blue (common) | `#2A4B9B` |
| Stamp red (rare) | `#B23A2B` |
| Stamp green | `#2F6B4F` |
| Stamp violet | `#5B3F8C` |
| Legendary | gold foil gradient + slow shimmer |

### Fonts (Google Fonts, exactly 4)
- `IM Fell English` — headings
- `Source Serif 4` — body
- `Special Elite` — form fields, labels, data (typewriter)
- `Big Shoulders Display` — stamp text (condensed caps)

### Globe Style
Ocean `#BFD0CC` · Land `#E7DBBE` · Thin ink-navy outlines · graticule ON · atmosphere OFF · no glow · slow auto-rotate stops on touch · visited fill = stamp ink at 85% opacity · tiny ink-dot point for countries with no GeoJSON polygon

### Textures
- Paper grain: inline SVG `feTurbulence` (no image files)
- Stamps: SVG with `feTurbulence + feDisplacementMap` rough edges · `mix-blend-mode: multiply` · slight random tilt seeded by ID (never changes between renders)

### Banned (hard)
- Purple / blue / pink gradients (except gold foil)
- Glassmorphism, blur cards
- Uniform rounded-2xl card grids
- Inter, Roboto, Space Grotesk, system fonts
- Emoji as icons; icons inside colored circles
- Centered hero text + gradient button
- Generic shimmer skeletons, confetti, bouncy spring on everything
- Default Tailwind colors (slate, indigo, etc.)

---

## Component Specs

### `<Stamp>` SVG component
- Shape: circle / oval / rectangle / hexagon — chosen by hash of `id`
- Text: curved, Big Shoulders Display caps + date
- Ink color by rarity: common=blue, rare=red, legendary=gold foil + slow shimmer
- Rough edges: `feTurbulence + feDisplacementMap`
- `mix-blend-mode: multiply`
- Tilt: slight random, seeded by `id`, stable across renders

### `<HoldToStamp>` interaction
- Hold 600 ms → ink ring fills around target
- Release → stamp slams: scale 1.35→1, 2° overshoot, ink bloom, 2px page shake
- `navigator.vibrate([18, 40, 12])`
- WebAudio thump (synthesized, no audio file, fail silently)
- Rare: overstamp banner "RARE FIND"
- Legendary: overstamp banner "LEGENDARY"
- Respect `prefers-reduced-motion`
- 44px minimum tap targets

---

## Data Model (localStorage keys)

```js
passport:    { name, home, no, issuedAt }
visited:     { "IN": "2026-10-11", ... }          // iso2 → date
finds:       { "IN-halwa": "2026-10-11", ... }    // id → date
customFinds: { "IN": [{ id, title }] }
```

---

## Share Code

Format: `LC1.<base64url>`  
Payload: `{ version, name (≤20 chars), home iso2, visited: bitset over COUNTRIES array, totalFinds, rareCount, legendaryCount }`  
Link: `/#/x/<code>` (hash routing, no Vercel rewrites needed)

**CRITICAL: Never reorder `COUNTRIES` array in `src/data/countries.js`**

---

## Globe GeoJSON Gotcha

Natural Earth 110m uses `ISO_A2 = -99` for France and Norway.  
→ Match using `ISO_A2_EH` or `ADM0_A3` instead.  
→ Missing tiny countries (SG, MT, MV…) = render small ink-dot point at lat/lng.

---

## Seeded Finds

12 countries with 8 finds each (5 common / 2 rare / 1 legendary):  
`IN AE JP FR TH ID IT GB US SG TR MY`  
Categories: food, landmark, souvenir, experience — real and specific.  
India must include Kerala/Kozhikode items (e.g. Kozhikode halwa, Malabar biryani, backwater houseboat).  
Other countries: "No finds catalogued yet" + ADD YOUR OWN FIND row.

---

## Rarity Mapping

| Rarity | Ink | Overstamp |
|---|---|---|
| Common | blue `#2A4B9B` | none |
| Rare | red `#B23A2B` | "RARE FIND" banner |
| Legendary | gold foil gradient + shimmer | "LEGENDARY" banner |

---

## Agent Hard Rules

1. Read REQUIREMENTS.md before every task.
2. `npm run build` after every task, fix errors yourself.
3. Commit after each finished task.
4. Never build anything in Scope OUT.
5. Never reorder `src/data/countries.js`.
6. No backend, no API keys, no database.
7. Mobile first 390px · Desktop = centered 480px column.
8. All localStorage in try/catch.
9. Before finishing any UI task: compare against /ref images and fix anything that looks like a generic template.

---

## Build Order (6 prompts)

| # | Task | ~Time |
|---|---|---|
| 1 | Foundation: Vite+React+Tailwind+PWA, design tokens, cover + onboarding, countries.js, store.js, 3-tab shell | 35 min |
| 2 | ATLAS globe: globe.gl, GeoJSON, matte style, search, counter, ticket-stub slip | 35 min |
| 3 | Country page + HoldToStamp + Stamp SVG + seeded finds (most important) | 40 min |
| 4 | PASSPORT tab: scroll-snap pages, holder page + MRZ, stamps scattered | 25 min |
| 5 | EXCHANGE tab: code gen + paste + Customs Desk + sample passports | 30 min |
| 6 | Slop audit, polish 3 hero moments, empty/error states, PWA icon, prod deploy | 30 min |

After prompt 3: always deploy `vercel --prod` so there's always a working live link.

## Exchange Tab Detail (Customs Desk)
- Two holder lines side by side
- Countries in common (count + small stamp row)
- "You've been, they haven't" list
- "They've been, you haven't" list
- Finds totals
- Travel Twins % = shared countries ÷ union of visited countries
- 3 sample passport chips (e.g. backpacker 60 countries, Gulf-hopper 25, first-timer 4)

## PASSPORT Tab Detail
- Page 1: name, home, passport no., issue date, MRZ (two `<` lines, decorative)
- Pages 2+: one per visited country, most recent first; entry stamp + collected find stamps scattered/tilted/overlapping
- Bottom: "PAGE 3 / 12" in Special Elite
- Empty state: blank ruled page, "NO ENTRIES YET. GO FILL ME."

---

## Stretch (only if 40+ min after prompt 6)
1. AI-generated finds via one serverless function (cache in localStorage)
2. Globe compare view: your ink vs theirs vs shared in violet
3. Share card: export holder page as image

## Emergency Fix Prompts
| Problem | Fix |
|---|---|
| Looks generic | Re-read §3, list violations, fix worst 3 |
| Globe lags | Reduce polygon resolution and re-renders, no visual changes |
| Compare decode fails | Make encoder/decoder symmetric, handle padding, add round-trip test |
| Stamps look flat | Add feDisplacementMap, uneven ink density, multiply blend |
