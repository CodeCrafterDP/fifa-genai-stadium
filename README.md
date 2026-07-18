# MatchDay OS — Stadium Intelligence

A GenAI-enabled concept for enhancing stadium operations and fan experience during the FIFA World Cup 2026. Single-page app, two linked views — a fan-facing companion and an operations command center — sharing one live backend.

**Live demo (Claude-hosted):** replace with your published claude.site link
**Local file:** `index.html` — just open it in a browser

---

## What it does

### Fan Companion
- Multilingual AI chat assistant (7 languages) for wayfinding, seating, accessibility, transport, and food questions — powered by live Claude API calls, not scripted responses
- AI-adjusted wayfinding card that reads real-time crowd density and explains its routing decision
- Interactive venue map (Leaflet + OpenStreetMap/CARTO) with the fan's gate, parking, transit, and the accessible entrance
- Accessibility mode, green-travel, and gate-alert toggles
- Personal sustainability footprint summary

### Ops Command Center
- Live stadium bowl heatmap (SVG) and a literal live gate map, both driven by the same shared density data
- **AI predictive alerts** — generates a fresh, real recommendation from the current crowd snapshot on demand
- **Incident summarizer** — condenses raw steward/medic radio chatter into a clean control-room brief and logs it
- **Trending fan questions** — aggregates real questions fans asked the chat assistant and has Claude synthesize themes + a recommended ops action
- **Multilingual staff broadcast** — write one message, pick languages, get instant translations, logged to a shared history
- Resource reallocation table, live KPI strip

---

## Architecture

**Frontend:** single static HTML file (`index.html`), vanilla JS, no build step. Leaflet.js (via cdnjs) for the map, Google Fonts for type.

**"Backend":** this app was built to run as a **Claude.ai Artifact**, which provides two capabilities that stand in for a real backend:

1. **`window.storage`** — a key-value store scoped to the artifact, with a `shared` flag. All operational state (crowd density, alerts, incidents, broadcasts, fan question log, KPIs) lives in one JSON blob under the key `matchday-stadium-state`, written/read with `shared: true` so every user/tab sees the same live state. A 5-second poll picks up writes made by other sessions.
2. **The Anthropic API** — the app calls `https://api.anthropic.com/v1/messages` directly from the browser for chat replies, incident summaries, translations, and predictive alerts. No API key is embedded in the code; Claude.ai's artifact runtime handles auth transparently.

**Important — running outside Claude.ai:** `window.storage` and the unauthenticated `api.anthropic.com` calls **only work inside the Claude.ai artifact runtime**. If you open `index.html` directly in a browser or host it elsewhere (Netlify, GitHub Pages, etc.), those calls will fail (silently, with errors logged to the console) and the app will fall back to its local default state with no persistence, sync, or AI responses.

To make this portable to a normal hosting environment, you'd need to:
- Replace `window.storage` calls with your own backend (e.g. a small Node/Express + SQLite or Postgres service, or Firebase/Supabase) exposing equivalent get/set endpoints
- Replace the direct `fetch("https://api.anthropic.com/v1/messages")` calls with calls to your own server, which holds a real Anthropic API key server-side (never expose an API key in client-side code)

## Map data

Centered on MetLife Stadium, East Rutherford, NJ (a real 2026 host venue), using OpenStreetMap/CARTO dark tiles (no API key required). Gate positions are illustrative offsets from the stadium center, not the venue's actual gate layout. Swapping in the Google Maps JS API instead just requires adding an API key and changing the tile-layer initialization in the `initMaps()` function.

## Disclosure

Crowd figures, sensor feeds, and gate positions are simulated for demonstration. Chat replies, incident summaries, predictive alerts, and translations are generated live by Claude. Because operational data is stored with `shared: true`, anyone with the published link reads/writes the same live state — don't put anything sensitive into the chat, incidents, or broadcasts fields.

## License

MIT — see `LICENSE`.
