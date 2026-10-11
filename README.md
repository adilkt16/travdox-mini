# 🛂 Layover Passport

> **Your passport, but you actually want to fill it.**

A tactile, physical-passport travel companion for travelers and collectors. Explore a vintage 3D globe, stamp visas and local finds with tactile hold-to-ink interactions, and exchange passports with fellow travelers—with zero backend and 100% client-side privacy.

[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-5A1F26?style=for-the-badge&logo=github)](https://adilkt16.github.io/travdox-mini/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-2F6B4F?style=for-the-badge)](https://adilkt16.github.io/travdox-mini/)
[![License](https://img.shields.io/badge/License-MIT-B23A2B?style=for-the-badge)](#license)

---

## ✨ Features

- **📖 Physical Passport Aesthetic** — Oxblood leatherette cover with foil insignia, aged deckle-edge paper grain (`SVG feTurbulence`), typewriter fonts, and Machine Readable Zone (MRZ).
- **🌍 Matte 3D Atlas** — Interactive, rotating 3D globe powered by `globe.gl` and Natural Earth GeoJSON. Tap any country to pull its customs ticket slip.
- **🖋️ Hold-to-Stamp Tactile Inking** — Press and hold (600ms) to stamp visas and hidden local finds with synthesized WebAudio stamp thumps and haptic feedback.
- **🤝 Zero-Server Passport Exchange** — Pack your travels into a compact URL code (`LC1.<base64url>`) or QR code to compare visited countries and finds at the Customs Desk with friends.
- **📱 Offline PWA** — Fully installable as an app on iOS and Android with automatic background service worker caching.
- **🔒 Private by Design** — No accounts, no database, no trackers. All passport holder data and stamps live exclusively in your device's `localStorage`.

---

## 🛠️ Tech Stack

- **Framework:** [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Globe & Geo:** [globe.gl](https://globe.gl/) (Three.js / WebGL) + Natural Earth
- **Routing:** [React Router](https://reactrouter.com/) (HashRouter)
- **PWA:** `vite-plugin-pwa` (Workbox)
- **Audio & Haptics:** Web Audio API (synthesized mechanical thuds) + Navigator Vibration API

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- `npm` (or `pnpm` / `yarn`)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/adilkt16/travdox-mini.git

# 2. Enter project folder
cd travdox-mini

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Building for Production

```bash
npm run build
```

The production-ready static assets will be output to the `dist/` directory.

---

## 🌐 Deployment

The project is preconfigured with GitHub Actions for instant deployment to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml`.

To host on your own custom domain or platform (Vercel, Netlify, Cloudflare Pages), simply deploy the `dist/` folder.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
