# Layover Passport: Requirements + Antigravity Playbook

Trimmed "Pokedex for travel". Built overnight, solo, 3 to 4 hours left, deadline 5:00 AM.
Visual world: **a real passport** (paper, ink, postmarks, hold-to-stamp).

---

## 0. Decisions (final, from your answers)

- Must keep: **3D globe** and **friend code + compare**
- Cut: photo verification, login, cloud save, bucket list, AI generation (stretch only)
- Visual world: passport stamps (paper, ink, postmarks)
- **No backend at all.** State lives in localStorage. The friend code carries the passport data inside it (no database, no Firebase, no API key). This removes the biggest setup and failure risk.
- Hosting: Vercel static deploy
- Build tool: Antigravity, Planning mode, one agent on `src/`

Honest tradeoffs you should know:
- Data is per device (clear the browser and it's gone). Fine for a hackathon, say so in the pitch.
- Finds are honor-system. Hold-to-stamp makes it feel earned, but it isn't proof. Pitch line: "photo proof is the next version."
- Friend compare is a snapshot: your friend shares a fresh code whenever they want to update.

## 1. What it is

A passport you fill with the world. Tick countries on a 3D globe, hold to press ink stamps for local finds (food, landmarks, souvenirs), and swap passport codes with friends to see who's been where.

**Pitch line:** "Your passport, but you actually want to fill it."

Judge fit: creativity (the passport world + hold-to-stamp), travel connection (it's a passport), execution (works end to end), demo (stamp thump on stage).

## 2. Scope

**In**
1. Onboarding: closed passport cover opens, issue your passport (name, home country, number)
2. ATLAS tab: 3D globe, country search, tap a country to open its visa slip
3. Country page: entry stamp + 8 finds (seeded for 12 countries), add-your-own find for the rest
4. PASSPORT tab: your stamped pages, swipeable, with counts
5. EXCHANGE tab: your code + link, paste a friend's code, "Customs Desk" compare, sample passports for the demo
6. Installable PWA

**Out (do not build, even if the agent suggests it)**
Login, database, leaderboards, chat, notifications, photo verification, bucket list, settings page, dark mode, onboarding tour.

## 3. Design brief (the anti-slop part)

The goal: someone should think "this has a point of view", not "this is a Tailwind template".

**Palette**
- Paper `#F1E8D2`, paper shadow `#E4D7B8`, ink navy `#1C2B4B` (all text)
- Stamp inks: blue `#2A4B9B`, red `#B23A2B`, green `#2F6B4F`, violet `#5B3F8C`
- Cover oxblood `#5A1F26`, gold foil gradient `#A57F2C` to `#F2DC8A` to `#C9A24B`
- Rarity = ink: common blue, rare red, legendary gold foil with a slow shimmer

**Type (exactly 4 families, Google Fonts)**
- Headings: IM Fell English
- Body: Source Serif 4
- Form fields, labels, data: Special Elite (typewriter)
- Stamp lettering: Big Shoulders Display (condensed caps)

**Texture**
- Paper grain from an inline SVG `feTurbulence` (no image files)
- Stamps are SVG: circle, oval, rectangle or hexagon (chosen by hash of the id), text on a curve, date, `feTurbulence` + `feDisplacementMap` for rough ink edges, `mix-blend-mode: multiply`, slight random tilt seeded by the id so it never changes between renders

**Signature interaction: hold to stamp**
Press and hold 600 ms (an ink ring fills), release and the stamp slams down: scale 1.35 to 1 with a 2 degree overshoot, ink bloom, 2px page shake, `navigator.vibrate([18,40,12])`, and a tiny WebAudio thump (synthesized, no audio files). Rare and legendary add an overstamp banner ("RARE FIND" / "LEGENDARY"). No confetti.

**Layout rules**
- Mobile first at 390px. On desktop, a centered 480px column on a paper desk background.
- Lists and forms laid out like passport pages and forms, not card grids
- Bottom nav = three bookmark-style tabs with text only: ATLAS, PASSPORT, EXCHANGE (typewriter font, no icons)
- Globe is matte, old-atlas style: pale sea-green ocean, paper-tan land, thin ink outlines, graticule lines, **no glow, no atmosphere**

**Banned (the agent must not do any of these)**
- Purple, blue or pink gradients; glassmorphism or blur cards
- Uniform rounded-2xl cards with soft drop shadows in a grid
- Inter, Roboto, Space Grotesk or system fonts
- Emoji as icons; icons inside colored circles
- Centered hero text with a gradient button
- Generic shimmer skeletons, confetti, bouncy spring on everything
- Default Tailwind colors (slate, indigo, etc.)

## 4. Screens

1. **Cover** (oxblood, gold foil, tap to open) then **Issue page** (typewriter fields, passport no. like LC-4821, ISSUE PASSPORT button, first stamp thumps for the home country)
2. **Atlas**: globe, search field at the top ("Find a country"), counter "23 / 195" typed like a form field, bottom slip when a country is tapped (ticket-stub look: country, status, ENTER button)
3. **Country page**: header like a form (COUNTRY / DATE OF ENTRY), entry stamp area, finds as ruled rows with rarity ink and a hold-to-stamp target, "Add your own find" row
4. **Passport**: horizontal scroll-snap pages, each page holds a country's stamps, scattered and tilted; first page shows the holder data
5. **Exchange**: my code (big, typewriter), Copy and Share, paste field, **Customs Desk** result: countries in common, "you've been, they haven't", "they've been, you haven't", a Travel Twins percentage; plus "Try a sample passport" chips

## 5. Data and share code

localStorage keys (all reads and writes wrapped in try/catch, render fine when empty):
```
passport: { name, home, no, issuedAt }
visited:  { "IN": "2026-10-11", ... }
finds:    { "IN-halwa": "2026-10-11", ... }
customFinds: { "IN": [ { id, title } ] }
```

Share code `LC1.<base64url>` containing: version, name (max 20 chars), home iso2, visited as a **bitset over the fixed `COUNTRIES` array** in `src/data/countries.js` (never reorder it), total finds, rare count, legendary count.
Link form: `/#/x/<code>` (hash routing so Vercel needs no rewrites). Opening the link goes straight to the compare screen.

## 6. Stack

React + Vite + Tailwind + `vite-plugin-pwa`, HashRouter, `globe.gl`, local GeoJSON (Natural Earth 110m) in `/public`. Fixed `COUNTRIES` list (iso2, name, lat, lng) is the source of truth, not the GeoJSON, because the 110m file lacks tiny countries (Singapore, Malta, Maldives...). Missing ones render as small points on the globe.

Gotcha to tell the agent: Natural Earth uses `-99` for `ISO_A2` on France and Norway. Match with `ISO_A2_EH` or `ADM0_A3` instead.

---

## 7. Setup (15 min, you do this by hand)

```bash
mkdir layover-passport && cd layover-passport
git init
mkdir refs seed
# copy this REQUIREMENTS.md into the folder
npm i -g vercel
vercel login
```

Optional but worth 5 minutes: save 3 images into `refs/` from Pinterest or Google Images, searching "passport stamp pages" and "vintage atlas globe". The agent designs far better from images.

Open the folder in Antigravity, then:

1. Create `.agent/rules/passport.md` with the rules below (or paste under Customization, Rules).
2. Create `.agent/workflows/ship.md` (below) so `/ship` works.
3. Agent autonomy: "Request review", allow list `npm`, `git`, `vercel`, `ls`.
4. Use **Planning mode** for prompts 1 to 5, and the strongest model in the dropdown for prompts 1, 3 and 6.

**`.agent/rules/passport.md`**
```md
# Layover Passport
Read REQUIREMENTS.md before any task. It is the source of truth, especially section 3 (design brief).

## Rules
- Run `npm run build` after every task and fix errors yourself.
- Commit after each finished task with a short message.
- Do not build anything listed under "Out" in REQUIREMENTS.md. Do not refactor working code.
- No backend, no API keys, no database. State is localStorage only, always inside try/catch.
- Never reorder the COUNTRIES array in src/data/countries.js.
- Mobile first at 390px. Desktop = centered 480px column.
- Respect prefers-reduced-motion. 44px minimum tap targets.

## Design (non-negotiable)
- Palette, 4 fonts, stamp style, and the banned list from REQUIREMENTS.md section 3
- No Tailwind default colors, no Inter/Roboto/Space Grotesk, no gradients except gold foil
- Before finishing any UI task, compare the result to the images in /refs (if any) and fix anything that looks like a generic template
```

**`.agent/workflows/ship.md`**
```md
Run npm run build and fix any errors. Commit all changes with a short message. Then run `vercel` and give me the preview URL. Only on the final run, use `vercel --prod`.
```

---

## 8. The prompts (run in order)

Before each prompt: `git status` should be clean, start a fresh agent conversation, Planning mode on. Skim the plan artifact for 30 seconds, approve, and make sure it doesn't plan anything from the "Out" list.

### Prompt 1: Foundation, design system, cover and onboarding (target 35 min)

```
Read @REQUIREMENTS.md and the rules in .agent/rules/passport.md. Look at any images in @refs for mood.

Set up Vite + React + Tailwind + vite-plugin-pwa (basic manifest only for now) with HashRouter. Put the palette from section 3 into the Tailwind theme (replace the defaults, don't extend them) and load the 4 Google fonts with preconnect and display=swap.

Build:
1. Global paper-grain background using an inline SVG feTurbulence noise (no image files).
2. The closed-passport cover screen: oxblood leatherette texture in CSS, gold-foil embossed "LAYOVER" title and a small crest drawn as inline SVG, tap to open with a 3D page-open animation (CSS 3D transform, about 500ms).
3. The issue page, designed like a passport data page: typewriter-font fields NAME and HOME COUNTRY (searchable select), an auto-generated passport number like LC-4821, and an ISSUE PASSPORT button.
4. src/data/countries.js: a fixed array of ~195 countries with iso2, name, lat, lng. Never reorder it later.
5. src/lib/store.js: localStorage state for passport, visited, finds, customFinds with React hooks. Wrap every access in try/catch.
6. The app shell shown after issuing: three bookmark-style tabs at the bottom labelled ATLAS, PASSPORT, EXCHANGE (text only, typewriter font, no icons), with three placeholder pages.
Desktop: a centered 480px column on a paper desk background.
Then run /ship.
```

**Expect:** a cover that looks like a closed passport, opens with a 3D flip, a typewriter-style form, then a 3-tab shell with empty pages. Fonts and paper grain visible. Live preview URL.
**Don't expect:** a globe, stamps, or any real content. The cover foil may look flat on the first try, that gets fixed in prompt 6.
**Checkpoint:** open the preview link on your phone. If it looks like a default Tailwind page (white background, Inter font), say: `The theme isn't applied. Fix the Tailwind config so default colors are replaced and the fonts load. Show me a screenshot at 390px.`

### Prompt 2: Atlas globe (target 35 min)

```
Build the ATLAS tab with globe.gl. Download the Natural Earth 110m countries GeoJSON (for example from the globe.gl repo's example datasets) into /public; do not load data from a CDN at runtime.

Styling (old atlas, matte): pale sea-green ocean (#BFD0CC), unvisited land paper-tan (#E7DBBE) with thin ink-navy outlines, graticule lines on, atmosphere OFF, no glow. Visited countries fill with a stamp ink (blue, red, green or violet picked by a hash of the iso code) at about 85% opacity. Slow auto-rotate that stops on touch.

Match polygons to src/data/countries.js by ISO code (Natural Earth uses -99 for France and Norway on ISO_A2, so use ISO_A2_EH or ADM0_A3). For any country in the list that has no polygon (Singapore, Malta, Maldives, etc.), render a small ink-dot point using its lat/lng.

On top: a search field "FIND A COUNTRY" (typeahead; picking one flies the globe to it and opens its slip) and a counter styled like a typed form field: "COUNTRIES  23 / 195".

Tapping a country opens a bottom slip styled like a torn ticket stub: country name, status (NOT YET VISITED / ENTERED), and a plain "Mark as entered" button for now (the stamp interaction comes next), plus a "Open page" link to /country/:iso. The home country is already marked visited from onboarding.

Keep it smooth on a mid-range phone: lower polygon resolution, no re-creating the globe on state change. Use the browser to confirm the globe renders and a tap opens the slip. Then run /ship.
```

**Expect:** a matte, sepia-ish atlas globe that rotates, lights up visited countries in different inks, search flies to a country, tap opens a ticket-stub slip. Counter updates and survives refresh.
**Don't expect:** the stamp animation, the country page, tiny countries to be perfectly tappable (the search is the fallback), and 60 fps on a very old phone.
**Checkpoint:** tick 3 countries on your phone, refresh, still there. If it lags: `Globe lags on my phone. Reduce polygon resolution and re-renders, no visual changes.`

### Prompt 3: Country page, hold-to-stamp, seeded finds (target 40 min, the most important prompt)

```
Build the stamping system and the country page.

1. A reusable <Stamp> SVG component: shape (circle, oval, rectangle, hexagon) chosen by a hash of the id; text on a curve in Big Shoulders Display caps; a date; ink color by rarity (common blue, rare red, legendary gold foil gradient with a slow shimmer); rough ink edges via feTurbulence + feDisplacementMap; mix-blend-mode multiply; a slight random tilt seeded by the id so it never changes between renders.
2. A <HoldToStamp> interaction: press and hold 600ms with an ink ring filling around the target; on release the stamp slams in (scale 1.35 to 1, 2 degree overshoot, ink bloom), the page shakes 2px, navigator.vibrate([18,40,12]), and a tiny synthesized WebAudio thump (no audio files, fail silently if blocked). Rare and legendary also show an overstamp banner ("RARE FIND" / "LEGENDARY"). No confetti. Respect prefers-reduced-motion.
3. Replace the plain "Mark as entered" button in the atlas slip with HoldToStamp for the country's ENTRY stamp.
4. /country/:iso page designed like a passport form: header fields COUNTRY and DATE OF ENTRY in typewriter style, the entry stamp area, then the finds as ruled rows (not cards): title, one-line description, rarity ink, and a HoldToStamp target. Collected rows show their stamp.
5. Seed file src/data/finds.js for these 12 countries: IN, AE, JP, FR, TH, ID, IT, GB, US, SG, TR, MY. Each has 8 finds: 5 common, 2 rare, 1 legendary, covering food, landmark, souvenir and experience. They must be real, specific and well known (no invented places). For India, include real Kerala and Kozhikode items (for example Kozhikode halwa, Malabar biryani, a backwater houseboat).
6. For any other country: a friendly "No finds catalogued yet" line and an "ADD YOUR OWN FIND" row (typed title, saved as a common find in customFinds).
Run /ship.
```

**Expect:** holding a find row fills an ink ring, then a stamp slams in with a thump, shake and vibration; stamps look like real ink, tilted and rough; India has local items; other countries let you add your own.
**Don't expect:** perfect stamp art on the first try (the ink look usually needs one fix pass), sound on every phone (some browsers block it), or finds for all 195 countries.
**Checkpoint:** on your phone, stamp one common and one rare find. Refresh, they should persist. **Deploy a prod link now** (`vercel --prod`), because from here on you always have a working version.
Fix prompt if stamps look flat: `The stamps look like flat icons. Make them look like rubber ink: rough edges via feDisplacementMap, uneven ink density, slight double-strike, multiply blend. Compare against @refs.`

### Prompt 4: My Passport pages (target 25 min)

```
Build the PASSPORT tab. A horizontal scroll-snap booklet. Page 1 is the holder page: name, home country, passport number, issue date, and a machine-readable zone at the bottom (two lines of < characters and the name/number in typewriter style, purely decorative). Then one page per visited country (most recent first), each page showing the entry stamp and the collected find stamps scattered with their seeded tilts and a few overlapping, like a real passport. A thin page counter "PAGE 3 / 12" in typewriter font at the bottom of each page. Totals on the holder page: countries, finds, rare, legendary. Empty state: a blank ruled page with the line "NO ENTRIES YET. GO FILL ME." Run /ship.
```

**Expect:** swipeable pages that look like a stamped passport, with overlapping stamps and a holder page.
**Don't expect:** page-curl physics, an export-as-image feature, or reordering pages.
**Checkpoint:** swipe through with 3+ countries stamped. If you're short on time, cut this to the holder page plus one scrolling list of stamps.

### Prompt 5: Exchange and Customs Desk (target 30 min)

```
Build the EXCHANGE tab.
1. Code generator: "LC1." + base64url of a compact payload: version, name (max 20 chars), home iso2, visited as a bitset over the fixed COUNTRIES array in src/data/countries.js (never reorder it), total finds, rare count, legendary count. Show it big in typewriter font with Copy and Share (Web Share API, copy fallback). Also produce a link of the form /#/x/<code>; opening it goes straight to the compare screen.
2. Paste field "ENTER A FRIEND'S CODE" with clear errors for invalid or unsupported codes.
3. The compare screen, styled as a CUSTOMS DESK form: two holder lines side by side, "COUNTRIES IN COMMON" (count plus a row of small stamps), "YOU'VE BEEN, THEY HAVEN'T", "THEY'VE BEEN, YOU HAVEN'T", finds totals, and a TRAVEL TWINS percentage (shared countries divided by countries either of you visited).
4. "TRY A SAMPLE PASSPORT" chips (three local personas, for example a backpacker with 60 countries, a Gulf-hopper with 25, a first-timer with 4) so the demo works with no second phone.
Pure client side, no network. Run /ship.
```

**Expect:** a code you can copy or share, a link that opens the compare screen, sample passports that give an instant result.
**Don't expect:** live sync (the code is a snapshot), accounts, or a friends list. Compare one code at a time.
**Checkpoint:** copy your code, open it in a private browser window or second phone via the link, and confirm the compare screen. If it breaks, it's almost always the base64url decode: `The compare decode fails. Make the encoder and decoder symmetric, handle padding, and add a round-trip test.`

### Prompt 6: Polish, slop audit, PWA, ship (target 30 min)

```
Final pass. Do these in order:
1. SLOP AUDIT: go through every screen at 390px using the browser and compare against section 3 of @REQUIREMENTS.md (banned list) and @refs. List every violation you find, then fix them. Typical culprits: default-looking buttons, uniform rounded cards, generic spacing, flat stamps, a foil cover that looks like a yellow gradient.
2. Polish the three hero moments only: the cover (foil and leather texture), the globe (colors and the slip), and the hold-to-stamp moment (ink bloom and overstamp banner).
3. Add empty, loading and error states with passport-flavored copy (for example "NOTHING TO DECLARE").
4. PWA: manifest name "Layover Passport", paper theme color, an icon drawn as an SVG stamp, installable.
5. Add a tiny credits line on the holder page: "Built overnight at LAYOVER 2026".
Do not change data or logic code. Run the build, commit, then deploy with `vercel --prod` and give me the URL.
```

**Expect:** a visible jump in feel, an installable PWA, and a prod URL.
**Don't expect:** new features, or the agent to catch every ugly spot. Do your own phone pass after.
**Checkpoint:** install it to your phone's home screen, then screenshot every screen and run the loop below.

**Screenshot loop (the best use of your last hour):** screenshot each screen on your phone into `refs/`, then in Fast mode: `Look at @refs/shot1.png and @refs/shot2.png. Fix what looks off, UI only. Keep to the design brief.`

---

## 9. Stretch (only if you have 40+ minutes after prompt 6)

1. AI-generated finds for any country through one serverless function (cache results in localStorage)
2. Compare view on the globe: your visited in one ink, theirs in another, shared in violet
3. Share card: export your holder page as an image

## 10. Time plan (3.5 hours, scale down if 3)

| Time | Task |
|---|---|
| 0:00 to 0:15 | Setup, rules, refs |
| 0:15 to 0:50 | Prompt 1 |
| 0:50 to 1:25 | Prompt 2 |
| 1:25 to 2:05 | Prompt 3, then `vercel --prod` |
| 2:05 to 2:30 | Prompt 4 |
| 2:30 to 3:00 | Prompt 5 |
| 3:00 to 3:30 | Prompt 6 |
| last 20 min | Submission, demo rehearsal, no new features |

**Cut order if you're behind:** (1) Prompt 4 becomes a simple stamp list, (2) skip sound, (3) skip the install icon polish. **Never cut:** globe, hold-to-stamp, compare.
**Hard rule:** after prompt 3, there is always a working prod link. Check what the submission needs (repo, live URL, video, description) and prepare it by 4:15 AM.

## 11. Final slop check (do it yourself, 5 minutes)

- Squint test: does each screen still feel like paper and ink, not a web app?
- Count the fonts: exactly 4. Any Inter or system font showing up?
- Any gradient other than gold foil? Any emoji? Any card grid?
- Are all stamps tilted differently, with rough edges?
- Does the thump land on the first stamp you show a judge?

## 12. Demo script (90 seconds)

1. Open the app: the passport cover, tap, issue it (10 s)
2. Spin the globe, search "India", open the slip (15 s)
3. Hold-to-stamp the entry, then Kozhikode halwa: thump (25 s)
4. Swipe the passport pages (10 s)
5. Exchange: load a sample passport, show the Customs Desk and Travel Twins % (20 s)
6. Close: "Your passport, but you actually want to fill it. Photo proof is next." (10 s)

## 13. Emergency fix prompts

| Problem | Prompt |
|---|---|
| Looks generic | `This looks like a generic web app. Re-read section 3 of @REQUIREMENTS.md, list what violates it, and fix the three worst offenders.` |
| Agent added extras | `Remove everything not in the Scope "In" list. Show me what you removed.` |
| Broke something | `git reset --hard` and rerun the prompt with one added line saying what went wrong |
| Globe lags | `Reduce polygon resolution and re-renders on the globe. No visual changes.` |
| Build fails on deploy | `Run npm run build, fix every error, and redeploy.` |
