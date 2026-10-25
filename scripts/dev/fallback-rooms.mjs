// Builds src/data/fallbackRooms.json (#154): the rooms that hosted at least
// one event in the last full Mon–Fri teaching week, so a first visit can
// still list rooms and start focus while THabella is unreachable. It is a
// fallback only; live data always replaces it.
//
//   node scripts/dev/fallback-rooms.mjs [YYYY-MM-DD]   (any day of the week)
//
// Without a date it uses the week before the current one. A week with too
// few teaching rooms (a break) is refused, so a holiday never shrinks it.
// With CATALOGUE_SUMMARY=<file> it also writes the added and removed rooms
// as Markdown, for the monthly refresh workflow (#156).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { thabella } from '../../api/_thabella.js';

const MIN_ROOMS = 80;
const OUT = new URL('../../src/data/fallbackRooms.json', import.meta.url);
const pad = (n) => String(n).padStart(2, '0');
const day = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function monday(ref) {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 12);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

async function get(path, body) {
  const { status, body: data } = await thabella(path, body);
  if (status !== 200) throw new Error(`${path}: HTTP ${status}`);
  return data;
}

const arg = process.argv[2];
const ref = arg ? new Date(`${arg}T12:00:00`) : new Date(Date.now() - 7 * 864e5);
const start = monday(ref);
const used = new Set();
for (let i = 0; i < 5; i++) {
  const d = new Date(start);
  d.setDate(start.getDate() + i);
  const periods = await get(`/period/findByDate/${encodeURIComponent(`${day(d)} 12:00`)}`, { sqlDate: `${day(d)} 12:00` });
  for (const p of periods) for (const ident of Object.keys(p.room_ident ?? p.roomIdent ?? {})) used.add(ident);
}
const rooms = (await get('/room/findRooms', {}))
  .filter((r) => r && typeof r.ident === 'string' && typeof r.name === 'string' && used.has(r.ident))
  // Only what the app shows; no staff names or emails.
  .map((r) => ({
    id: r.id,
    ident: r.ident,
    name: r.name,
    seatsRegular: r.seatsRegular ?? null,
    seatsExam: r.seatsExam ?? null,
    facilities: r.facilities ?? null,
    bookable: r.bookable ?? null,
    untisLongname: r.untisLongname ?? null,
  }))
  .sort((a, b) => a.ident.localeCompare(b.ident));
if (rooms.length < MIN_ROOMS) throw new Error(`only ${rooms.length} teaching rooms in the week of ${day(start)}; pick a lecture week`);
const before = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')).rooms ?? [] : [];
writeFileSync(OUT, `${JSON.stringify({ version: 1, week: day(start), rooms }, null, 1)}\n`);
if (process.env.CATALOGUE_SUMMARY) {
  const names = (list) => new Map(list.map((r) => [r.ident, r.name]));
  const [was, now] = [names(before), names(rooms)];
  const added = [...now].filter(([id]) => !was.has(id)).map(([, n]) => n);
  const removed = [...was].filter(([id]) => !now.has(id)).map(([, n]) => n);
  const list = (title, items) => (items.length ? `**${title}** (${items.length}): ${items.join(' · ')}\n\n` : '');
  writeFileSync(
    process.env.CATALOGUE_SUMMARY,
    `${rooms.length} rooms from the week of ${day(start)} (was ${before.length}).\n\n${list('Added', added)}${list('Removed', removed)}`,
  );
}
console.log(`${rooms.length} rooms from the week of ${day(start)} → src/data/fallbackRooms.json`);
