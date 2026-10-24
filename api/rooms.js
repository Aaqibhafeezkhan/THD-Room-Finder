import { thabella } from './_thabella.js';

// ESM: the root package.json declares "type": "module", so Vercel evaluates
// this function as ESM — `export default`, not `module.exports`.
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { status, body } = await thabella('/room/findRooms', {});
  // Only good answers are cached; an outage is never served for a day.
  if (status === 200) res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600');
  else res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}
