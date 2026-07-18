# MatchDay OS — Stadium Intelligence

A GenAI-enabled concept for enhancing stadium operations and fan experience during the FIFA World Cup 2026. Two linked views — a fan-facing companion and an operations command center — sharing one live backend.

**Claude.ai-hosted demo:** https://claude.ai/public/artifacts/663e9dbb-3670-447c-bccb-429515acf58e

---

## Project structure

```
.
├── frontend/
│   ├── index.html            ← self-hosted build, talks to backend/server.js
│   └── claude-artifact.html  ← original build, for pasting into a Claude.ai Artifact
├── backend/
│   ├── server.js             ← Express server: storage API + Anthropic proxy + static hosting
│   ├── package.json
│   ├── .env.example
│   └── data/                 ← on-disk JSON store (created automatically, gitignored)
├── README.md
└── LICENSE
```

There are **two frontend builds** because this project started as a Claude.ai Artifact (which provides free built-in storage and API access), and was then extended with a real backend so it can run anywhere:

- **`frontend/claude-artifact.html`** — uses Claude.ai's `window.storage` and calls `api.anthropic.com` directly. Only works when run inside the Claude.ai Artifact runtime (e.g. pasted into claude.ai or published as an artifact). Zero setup, no server needed.
- **`frontend/index.html`** — identical UI and features, but calls a real backend (`/api/storage/...`, `/api/claude`) instead. This is the one `backend/server.js` serves, and the one to use for self-hosting.

---

## What it does

### Fan Companion
- Multilingual AI chat assistant (7 languages) for wayfinding, seating, accessibility, transport, and food questions
- AI-adjusted wayfinding card that reads real-time crowd density and explains its routing decision
- Interactive venue map (Leaflet + OpenStreetMap/CARTO, no API key required) with the fan's gate, parking, transit, and the accessible entrance
- Accessibility mode, green-travel, and gate-alert toggles
- Personal sustainability footprint summary

### Ops Command Center
- Live stadium bowl heatmap (SVG) and a literal live gate map, both driven by the same shared density data
- **AI predictive alerts** — generates a fresh recommendation from the current crowd snapshot on demand
- **Incident summarizer** — condenses raw steward/medic radio chatter into a clean control-room brief and logs it
- **Trending fan questions** — aggregates real questions fans asked the chat assistant and has Claude synthesize themes + a recommended ops action
- **Multilingual staff broadcast** — write one message, pick languages, get instant translations, logged to a shared history
- Resource reallocation table, live KPI strip

---

## Running it locally (full stack)

Requires Node.js 18+.

```bash
cd backend
npm install
cp .env.example .env
# edit .env and add your ANTHROPIC_API_KEY (get one at https://console.anthropic.com/)
npm start
```

Then open **http://localhost:3000** — the backend serves `frontend/index.html` and both the storage API and the Claude proxy live at `/api/*`.

Without an API key set, the app still runs — the crowd map, toggles, and static UI work fine — but chat replies, incident summaries, translations, and predictive alerts will return an error until `ANTHROPIC_API_KEY` is set.

### API endpoints (backend/server.js)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/storage/:key` | Read a stored JSON blob |
| `POST` | `/api/storage/:key` | Write `{ "value": "<string>" }` |
| `DELETE` | `/api/storage/:key` | Delete a key |
| `POST` | `/api/claude` | Body `{ system, message }` → proxies to the Anthropic Messages API, returns `{ text }` |
| `GET` | `/api/health` | Returns `{ ok, hasApiKey }` |

State persists to `backend/data/store.json` (created automatically, gitignored — it's runtime data, not source).

---

## Deploying

- **Frontend only, on Claude.ai:** use `frontend/claude-artifact.html` — publish it as a Claude Artifact and it works with zero backend setup.
- **Full stack, anywhere that runs Node:** deploy the `backend/` folder (which also serves the frontend) to something like Render, Railway, Fly.io, or a VPS. Set `ANTHROPIC_API_KEY` as an environment variable there — **never commit it to the repo**. `backend/.env` is gitignored for this reason.
- **Static-only hosting (GitHub Pages, Netlify, etc.):** you can host `frontend/claude-artifact.html` there, but it won't function — `window.storage` and unauthenticated `api.anthropic.com` calls only exist inside the Claude.ai runtime. Use `frontend/index.html` + a deployed `backend/` instead.

---

## Map data

Centered on MetLife Stadium, East Rutherford, NJ (a real 2026 host venue), using OpenStreetMap/CARTO dark tiles. Gate positions are illustrative offsets from the stadium center, not the venue's actual gate layout. To use the Google Maps JS API instead, add an API key and swap the tile-layer initialization in the `initMaps()` function of either frontend file.

## Disclosure

Crowd figures, sensor feeds, and gate positions are simulated for demonstration. Chat replies, incident summaries, predictive alerts, and translations are generated live by Claude. Storage in both builds is shared across every client hitting the same backend/artifact — don't put anything sensitive into the chat, incidents, or broadcasts fields.

## License

MIT — see `LICENSE`.
