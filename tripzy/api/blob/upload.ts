/**
 * Vercel serverless function — server-side Vercel Blob upload
 * Receives: POST with raw file bytes
 *   Headers: Content-Type (mime), x-blob-path (storage path)
 * Returns:  { url }
 */
import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { api: { bodyParser: false } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const blobPath    = req.query['path'] as string;
  const contentType = (req.headers['content-type'] as string) ?? 'application/octet-stream';

  if (!blobPath) return res.status(400).json({ error: 'Missing path query param' });

  try {
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', resolve);
      req.on('error', reject);
    });

    const buffer = Buffer.concat(chunks);
    const blob = await put(blobPath, buffer, {
      access: 'public',
      contentType,
    });

    console.log('Upload completed:', blob.url);
    return res.json({ url: blob.url });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[blob] Error:', msg);
    return res.status(400).json({ error: msg });
  }
}
