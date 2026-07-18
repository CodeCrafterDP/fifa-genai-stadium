/**
 * MatchDay OS — backend
 *
 * Two jobs:
 *  1. A tiny key/value storage API (mirrors the shape of Claude.ai's artifact
 *     window.storage) so the shared operational state — crowd density, alerts,
 *     incidents, broadcasts, fan question log — persists on disk and is
 *     readable/writable by every client hitting this server.
 *  2. A proxy to the Anthropic API, so the real API key lives only on the
 *     server and is never exposed to the browser.
 *
 * Also serves the static frontend, so `npm start` runs the whole app.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

/* ---------------- storage ---------------- */
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');
fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '{}');

function readStore() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (e) {
    console.error('store read failed, resetting', e);
    return {};
  }
}
function writeStore(store) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

app.get('/api/storage/:key', (req, res) => {
  const store = readStore();
  const value = store[req.params.key];
  if (value === undefined) return res.status(404).json({ error: 'not found' });
  res.json({ key: req.params.key, value });
});

app.post('/api/storage/:key', (req, res) => {
  if (typeof req.body.value !== 'string') {
    return res.status(400).json({ error: 'body must be { "value": "<string>" }' });
  }
  const store = readStore();
  store[req.params.key] = req.body.value;
  writeStore(store);
  res.json({ key: req.params.key, value: req.body.value });
});

app.delete('/api/storage/:key', (req, res) => {
  const store = readStore();
  delete store[req.params.key];
  writeStore(store);
  res.json({ key: req.params.key, deleted: true });
});

/* ---------------- Claude proxy ---------------- */
app.post('/api/claude', async (req, res) => {
  const { system, message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'missing "message" in body' });
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set on the server (see .env.example)' });
  }
  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1000,
        system: system || undefined,
        messages: [{ role: 'user', content: message }],
      }),
    });
    const data = await upstream.json();
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: data.error?.message || 'Anthropic API error' });
    }
    const text = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    res.json({ text });
  } catch (e) {
    console.error('claude proxy failed', e);
    res.status(500).json({ error: 'failed to reach Anthropic API' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY) });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MatchDay OS backend running on http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠️  ANTHROPIC_API_KEY not set — chat, summaries, translations, and insights will fail until you add one to .env');
  }
});
