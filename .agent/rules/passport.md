# Layover Passport
Read REQUIREMENTS.md and PROJECT_SPEC.md before any task. It is the source of truth, especially section 3 (design brief).

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
