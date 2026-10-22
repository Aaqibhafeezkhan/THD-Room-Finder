// The page behind a gathering link (ADR 0008). Chat apps read the og: tags
// and show the gathering's picture from /api/gathering-card: the room set up
// with the people in it, in white on the brand gradient (G4). No counts and
// no names. People opening the link go on to /g/<link>?app in the app.

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const isGatheringLink = (link) => /^[a-z]{3,9}-[a-z]{3,9}-[1-9][0-9]$/.test(String(link));

const KIND = { focus: 'Group focus', games: 'Game night', talk: 'Talk', meeting: 'Meeting' };
const fmt = (iso, opts) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', ...opts }).format(new Date(iso));

export function gatheringPreview(preview) {
  if (!preview) {
    return { title: 'A gathering on THD Room Finder', description: 'Open the link to see it and reply.', card: null };
  }
  const kind = KIND[preview.kind] ? preview.kind : 'meeting';
  const room = String(preview.room_code ?? '').slice(0, 24);
  const day = fmt(preview.starts_at, { weekday: 'short', day: 'numeric', month: 'short' });
  const time = fmt(preview.starts_at, { hour: '2-digit', minute: '2-digit', hour12: false });
  const org = String(preview.org_name ?? '').slice(0, 60);
  const title = `${preview.cancelled ? 'Cancelled: ' : ''}${String(preview.title ?? KIND[kind]).slice(0, 60)} · ${day}, ${time}${room ? ` · ${room}` : ''}`;
  const description = preview.cancelled
    ? `${org} cancelled this gathering.`
    : `${KIND[kind]} by ${org}. Reply Going, Maybe or Can't.`;
  const q = new URLSearchParams({
    k: kind,
    c: String(Math.max(13, Math.min(300, Number(preview.capacity) || 13))),
    r: room,
    p: String(preview.replies ?? '').replace(/[^gm]/g, '').slice(0, 300),
  });
  if (preview.cancelled) q.set('x', '1');
  return { title, description, card: q.toString() };
}

export function gatheringPage(preview, link, origin) {
  const safe = isGatheringLink(link) ? link : '';
  const { title, description, card } = gatheringPreview(preview);
  const image = card ? `${origin}/api/gathering-card?${card}` : `${origin}/og.jpg`;
  const url = `${origin}/g/${safe}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="noindex">
<meta property="og:type" content="website">
<meta property="og:site_name" content="THD Room Finder">
<meta property="og:url" content="${esc(url)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="The room set up for the gathering, with the people who replied">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${esc(image)}">
<link rel="icon" type="image/svg+xml" href="/icons/app-icon.svg">
<script>location.replace(${JSON.stringify(`/g/${safe}?app`)});</script>
</head>
<body style="font-family: system-ui, sans-serif; padding: 24px;">
<p><a href="/g/${esc(safe)}?app">Open the gathering in THD Room Finder</a></p>
</body>
</html>`;
}
