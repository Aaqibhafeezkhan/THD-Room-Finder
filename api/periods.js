import { thabella } from './_thabella.js';

// ESM: the root package.json declares "type": "module", so Vercel evaluates
// this function as ESM — `export default`, not `module.exports`.
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'date query parameter required (YYYY-MM-DD HH:mm)' });
  }

  const { status, body } = await thabella(`/period/findByDate/${encodeURIComponent(date)}`, { sqlDate: date });
  if (status === 200) res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
  else res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}
