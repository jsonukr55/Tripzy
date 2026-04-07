/**
 * Local dev API server — Vercel Blob upload
 * Run via VS Code F5 "Debug: API Server" or: node dev-api.js
 */
require('dotenv').config({ path: '.env' });

const express = require('express');

const app = express();

// ── CORS ───────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── Upload endpoint ────────────────────────────────────────────────────────
app.post('/api/blob/upload', (req, res) => {
  const blobPath    = String(req.query.path || '').trim();
  const contentType = req.headers['content-type'] || 'application/octet-stream';

  // Strip surrounding quotes that dotenvx may leave in token values
  const token = (process.env.BLOB_READ_WRITE_TOKEN || '').replace(/^["']|["']$/g, '');

  console.log(`[upload] path="${blobPath}" type="${contentType}" tokenLen=${token.length}`);

  if (!blobPath) {
    return res.status(400).json({ error: 'Missing ?path query param' });
  }
  if (!token) {
    return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN not set in .env' });
  }

  // Read raw request body — no JSON parser, no size limits
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', async () => {
    try {
      const buffer = Buffer.concat(chunks);
      console.log(`[upload] buffer size: ${buffer.length} bytes`);

      // Call Vercel Blob REST API directly (avoids SDK version issues)
      const uploadUrl = `https://blob.vercel-storage.com/${blobPath}`;
      const response  = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': contentType,
          'x-api-version': '7',
        },
        body: buffer,
      });

      const text = await response.text();
      console.log(`[upload] Vercel response ${response.status}: ${text.slice(0, 200)}`);

      if (!response.ok) {
        return res.status(400).json({ error: `Vercel Blob: ${response.status} — ${text}` });
      }

      const result = JSON.parse(text);
      res.json({ url: result.url });
    } catch (err) {
      console.error('[upload] Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  req.on('error', (err) => {
    console.error('[upload] Stream error:', err.message);
    res.status(500).json({ error: err.message });
  });
});

const PORT = 3002;
app.listen(PORT, () => console.log(`[api] API server running on http://localhost:${PORT}`));
