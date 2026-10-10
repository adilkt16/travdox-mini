# Prompting Guide — Layover Passport (Lower Model Edition)

> Run these in order. Each prompt is self-contained and copy-paste ready.
> Always start a **fresh conversation** for each prompt.
> Always paste `PROJECT_SPEC.md` as the first message (see Step 0).

---

## Step 0 — Do This Once Before Any Prompt

### 0A. Project setup (terminal)
```bash
mkdir layover-passport && cd layover-passport
git init
npx -y create-vite@latest ./ --template react
npm install
npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa
npm install globe.gl react-router-dom
npx tailwindcss init -p
```

### 0B. Prime every conversation (paste this at the top of EVERY prompt)
```
You are building a hackathon app called Layover Passport.
Read and follow every rule in PROJECT_SPEC.md — it is the source of truth.
Never build anything in the Scope OUT list.
Never reorder src/data/countries.js.
All localStorage in try/catch.
Run `npm run build` after every task and fix all errors before finishing.
```

---

## Prompt 1 — Foundation, Cover & Shell
**Goal:** Vite running, design tokens live, passport cover screen, issue form, 3-tab shell

```
[PASTE Step 0B PRIME BLOCK HERE]

Task: Build the project foundation.

1. Tailwind config: replace ALL default colors with the palette from PROJECT_SPEC.md. Add these 4 Google Fonts with preconnect + display=swap: IM Fell English, Source Serif 4, Special Elite, Big Shoulders Display. Apply them as the default font stack.

2. Global paper-grain background: inline SVG feTurbulence filter on the body (no image files).

3. Closed passport cover screen:
   - Oxblood (#5A1F26) leatherette texture in CSS
   - Gold foil embossed "LAYOVER" title (gradient: #A57F2C → #F2DC8A → #C9A24B)
   - Small crest as inline SVG
   - Tap/click to open with a CSS 3D page-flip animation (~500ms)

4. Issue page (shown after the flip):
   - Passport-form layout, Special Elite (typewriter) font
   - Fields: NAME and HOME COUNTRY (searchable select)
   - Auto-generated passport number format: LC-XXXX
   - ISSUE PASSPORT button

5. src/data/countries.js: fixed array of ~195 countries, each with { iso2, name, lat, lng }. Never reorder this file.

6. src/lib/store.js: React hooks for localStorage keys: passport, visited, finds, customFinds. All reads/writes in try/catch.

7. After issuing: 3-tab bottom nav — ATLAS, PASSPORT, EXCHANGE — in Special Elite font, bookmark-style, text only, no icons. Three empty placeholder pages.

Desktop: centered 480px column. Mobile first at 390px.
Run npm run build and fix all errors.
```

**✅ Checkpoint:** Cover looks like a closed passport (oxblood + gold, not white/blue). Opens with a 3D flip. Typewriter font on the form. Paper-tan background, not white.

---

## Prompt 2 — Atlas Globe
**Goal:** Matte 3D globe, visited countries highlighted, search, tap to open slip

```
[PASTE Step 0B PRIME BLOCK HERE]

Task: Build the ATLAS tab using globe.gl.

1. Download Natural Earth 110m countries GeoJSON into /public/ne_110m.geojson (do not load from CDN at runtime).

2. Globe styling (old-atlas matte, no glow):
   - Ocean: #BFD0CC
   - Unvisited land: #E7DBBE with thin #1C2B4B outlines
   - Graticule lines: ON
   - Atmosphere: OFF
   - Visited countries: fill with stamp ink color (pick by hashing iso2 — blue, red, green or violet from PROJECT_SPEC.md) at 85% opacity
   - Slow auto-rotate that stops on touch/drag

3. GeoJSON gotcha: Natural Earth uses ISO_A2 = -99 for France and Norway. Match using ISO_A2_EH or ADM0_A3. For countries in src/data/countries.js with no matching polygon (e.g. SG, MT, MV), render a small ink-dot point at their lat/lng.

4. UI on top of globe:
   - Search field "FIND A COUNTRY" with typeahead (Special Elite font). Selecting a country flies the globe to it and opens its slip.
   - Counter styled like a typed form field: "COUNTRIES  X / 195"

5. Tapping a country opens a bottom slip styled like a torn ticket stub:
   - Country name, status (NOT YET VISITED / ENTERED)
   - "Mark as entered" button (plain for now — stamp interaction comes next)
   - "Open page" link to /country/:iso

Home country from onboarding is already marked visited.
Run npm run build and fix all errors.
```

**✅ Checkpoint:** Globe is sepia/matte (not glowy/blue). Visited countries show colored. Tapping opens the slip. Counter updates. Refresh → data persists.

---

## Prompt 3 — Hold-to-Stamp + Country Page (MOST IMPORTANT)
**Goal:** The signature interaction working end-to-end, seeded finds for 12 countries

```
[PASTE Step 0B PRIME BLOCK HERE]

Task: Build the stamping system and country page. This is the most important prompt.

1. <Stamp> SVG component:
   - Shape (circle/oval/rectangle/hexagon) chosen by hash of id — stable across renders
   - Text on a curve in Big Shoulders Display caps + date below
   - Ink color by rarity: common=blue #2A4B9B, rare=red #B23A2B, legendary=gold foil gradient with slow shimmer
   - Rough ink edges: feTurbulence + feDisplacementMap SVG filters
   - mix-blend-mode: multiply
   - Tilt: slight random angle seeded by id, same every render

2. <HoldToStamp> interaction wrapper:
   - Press and hold 600ms → ink ring fills around the target area
   - On release: stamp slams in with scale 1.35→1, 2° overshoot, ink bloom effect
   - Page shakes 2px
   - navigator.vibrate([18, 40, 12]) — fail silently if unsupported
   - Synthesized WebAudio thump (no audio files, fail silently if blocked)
   - Rare → overstamp banner "RARE FIND"
   - Legendary → overstamp banner "LEGENDARY"
   - Respect prefers-reduced-motion (skip animations, keep the state change)
   - 44px minimum tap target

3. Replace the plain "Mark as entered" button in the atlas slip with <HoldToStamp> for the country entry stamp.

4. /country/:iso page:
   - Header like a passport form: COUNTRY and DATE OF ENTRY in Special Elite
   - Entry stamp area (uses <HoldToStamp>)
   - Finds as ruled rows (not cards): title, one-line description, rarity ink color, <HoldToStamp> target
   - Collected finds show their <Stamp>

5. src/data/finds.js — seed 8 finds for these 12 countries: IN, AE, JP, FR, TH, ID, IT, GB, US, SG, TR, MY.
   Each country: 5 common, 2 rare, 1 legendary.
   Categories: food, landmark, souvenir, experience.
   Must be real, specific, well-known.
   India must include: Kozhikode halwa (common), Malabar biryani (common), Kerala backwater houseboat (rare).

6. For any other country: "No finds catalogued yet." message + ADD YOUR OWN FIND row (text input, saves as common find in customFinds localStorage key).

Run npm run build and fix all errors.
```

**✅ Checkpoint:** Hold a find row → ink ring fills → stamp slams with thump + shake + vibration. Stamps look like real ink (rough edges, tilted, multiply blend). Refresh → stamps persist. **Deploy `vercel --prod` now — always have a live link from here on.**

---

## Prompt 4 — Passport Pages
**Goal:** Swipeable booklet that looks like a real stamped passport

```
[PASTE Step 0B PRIME BLOCK HERE]

Task: Build the PASSPORT tab.

1. Horizontal scroll-snap booklet — each page is passport-sized.

2. Page 1 (Holder page):
   - Name, home country, passport number, issue date — styled like passport data page
   - Machine-readable zone at the bottom: two lines of < characters with name/number in Special Elite (purely decorative)
   - Totals: countries visited, total finds, rare count, legendary count

3. Pages 2+ (one per visited country, most recent first):
   - Entry stamp in the upper area
   - Collected find stamps scattered across the page, overlapping, each with its seeded tilt — like a real passport
   - Country name + date of entry as a small header

4. Bottom of each page: "PAGE X / Y" in Special Elite

5. Empty state: a blank ruled page with the text "NO ENTRIES YET. GO FILL ME." in IM Fell English

Run npm run build and fix all errors.
```

**✅ Checkpoint:** Swipe through pages. Stamps are scattered/tilted/overlapping, not in a grid. Holder page shows counts. Empty state shows if no countries visited.

---

## Prompt 5 — Exchange & Customs Desk
**Goal:** Generate a shareable code, paste a friend's, compare side by side

```
[PASTE Step 0B PRIME BLOCK HERE]

Task: Build the EXCHANGE tab. Pure client side, no network.

1. Code generator:
   - Format: "LC1." + base64url of compact payload: { version, name (max 20 chars), home iso2, visited as bitset over the COUNTRIES array in src/data/countries.js (NEVER reorder it), totalFinds, rareCount, legendaryCount }
   - Display the code large in Special Elite font
   - "COPY" button (clipboard API)
   - "SHARE" button (Web Share API, fallback to copy)
   - Also show the shareable link: /#/x/<code>

2. Hash route /#/x/<code>: opening this URL goes straight to the compare screen with that code pre-loaded.

3. Paste field: "ENTER A FRIEND'S CODE" with clear error messages for invalid or unsupported codes.

4. Customs Desk compare screen (styled like a customs form):
   - Two holder lines side by side (you vs them)
   - "COUNTRIES IN COMMON" — count + row of small stamps
   - "YOU'VE BEEN, THEY HAVEN'T" — list
   - "THEY'VE BEEN, YOU HAVEN'T" — list
   - Finds totals for each
   - TRAVEL TWINS % = shared countries ÷ union of all visited countries

5. "TRY A SAMPLE PASSPORT" — 3 chips:
   - Backpacker (60 countries, many finds)
   - Gulf-hopper (25 countries, Gulf region heavy)
   - First-timer (4 countries)

Run npm run build and fix all errors.
```

**✅ Checkpoint:** Copy your code → open in private/incognito window via the link → compare screen loads with your data shown as "them". Travel Twins % appears. Sample passports give instant results without a second phone.

---

## Prompt 6 — Polish, Slop Audit & Final Deploy
**Goal:** Fix anything that looks generic, add PWA, ship

```
[PASTE Step 0B PRIME BLOCK HERE]

Task: Final polish pass. Do NOT change any data or logic. UI and PWA only.

1. SLOP AUDIT — check every screen at 390px viewport against this banned list from PROJECT_SPEC.md:
   - Any purple/blue/pink gradient (not gold foil)? Fix it.
   - Any glassmorphism or blur? Remove.
   - Any uniform rounded card grid? Break it up.
   - Inter, Roboto, or system font showing? Replace.
   - Any emoji used as icon? Remove.
   - Any confetti or bouncy spring on everything? Remove.
   - Default Tailwind slate/indigo colors? Replace with the spec palette.
   - Stamps looking flat (not rough ink)? Fix feDisplacementMap.
   List every violation found, then fix them all.

2. Polish ONLY these 3 hero moments (everything else stays):
   - Cover: foil gradient must shimmer, leather texture must be visible
   - Globe slip: must look like a torn ticket stub, not a card
   - Hold-to-stamp: ink bloom must be visible, overstamp banners must appear

3. Empty, loading and error states — use passport-flavored copy:
   - No countries: "NOTHING TO DECLARE"
   - Loading: "CHECKING RECORDS..."
   - Invalid code: "ENTRY REFUSED"

4. PWA manifest:
   - name: "Layover Passport"
   - theme_color: "#F1E8D2" (paper)
   - Icon: drawn as an SVG stamp shape (no PNG files needed for basic installability)

5. Add a credits line on the holder page: "Built overnight at LAYOVER 2026" in Special Elite.

Run npm run build, fix all errors, commit, then deploy: `vercel --prod`
Return the production URL.
```

**✅ Checkpoint:** Install to phone home screen. Screenshot all 5 screens. Each should feel like paper + ink, not a web app. Exactly 4 fonts visible. No white backgrounds.

---

## Time Budget

| Clock | Step |
|---|---|
| 0:00 | Step 0 setup (you do this by hand, ~15 min) |
| 0:15 | Prompt 1 |
| 0:50 | Prompt 2 |
| 1:25 | Prompt 3 → deploy prod link |
| 2:05 | Prompt 4 |
| 2:30 | Prompt 5 |
| 3:00 | Prompt 6 → final prod deploy |
| 3:30 | Submission prep, demo rehearsal |

## Cut Order (if behind)
1. Prompt 4 → simplify to a single scrolling stamp list (skip swipe pages)
2. Skip WebAudio thump
3. Skip PWA icon polish
4. **Never cut:** globe, hold-to-stamp, compare

## If Something Breaks

| Problem | What to say |
|---|---|
| Looks like a generic web app | `Re-read the Scope and Design System in PROJECT_SPEC.md. List every violation on screen, fix the 3 worst.` |
| Globe lags on phone | `Reduce polygon resolution and globe re-renders. No visual changes.` |
| Compare decode fails | `Make the LC1 encoder and decoder symmetric. Handle base64url padding. Add a round-trip unit test.` |
| Stamps look flat | `Stamps look like flat SVG icons. Add feDisplacementMap, uneven ink density, mix-blend-mode multiply. They must look like rubber stamp ink.` |
| Build error on deploy | `Run npm run build, show me every error, fix them all, redeploy.` |
| Agent added something from Out list | `Remove everything not in the Scope IN list from PROJECT_SPEC.md. Show me what you removed.` |
