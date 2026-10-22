// The page behind a study table link (ADR 0007). Chat apps read the og: tags
// and show the table's seat ring from /api/table-card as the preview; a
// person opening the link goes on to /t/<link>?app in the app. The preview
// comes from table_preview: topic, room, time and seats, never names.

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const isTableLink = (link) => /^[a-z]{3,9}-[a-z]{3,9}-[1-9][0-9]$/.test(String(link));

const fmt = (iso, opts) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', ...opts }).format(new Date(iso));

/** Title, description and the card's query for one preview (or null). */
export function tablePreview(preview) {
  if (!preview) {
    return { title: 'A study table on THD Room Finder', description: 'Open the link to see the study table and take a seat.', card: null };
  }
  const seats = Math.max(1, Math.min(12, Number(preview.seats) || 4));
  const taken = Math.max(1, Math.min(seats, Number(preview.taken) || 1));
  const topic = (preview.topic || 'Study table').slice(0, 40);
  const day = fmt(preview.starts_at, { weekday: 'short', day: 'numeric', month: 'short' });
  const time = (iso) => fmt(iso, { hour: '2-digit', minute: '2-digit', hour12: false });
  const room = String(preview.room_code ?? '').slice(0, 24);
  const when = `${day}, ${time(preview.starts_at)}`;
  const title = `${preview.cancelled ? 'Cancelled: ' : ''}${topic} · ${when}${room ? ` · ${room}` : ''}`;
  const description = preview.cancelled
    ? 'The host cancelled this study table.'
    : taken >= seats
      ? `Full · ${taken} of ${seats} seats. You can still say maybe. An invite, not a room booking.`
      : `${taken} of ${seats} seats taken. Take a seat or say maybe. An invite, not a room booking.`;
  const q = new URLSearchParams({ s: String(seats), k: String(taken), r: room });
  if (preview.cancelled) q.set('x', '1');
  return { title, description, card: q.toString() };
}

export function tablePage(preview, link, origin) {
  const safe = isTableLink(link) ? link : '';
  const { title, description, card } = tablePreview(preview);
  const image = card ? `${origin}/api/table-card?${card}` : `${origin}/og.jpg`;
  const url = `${origin}/t/${safe}`;
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
<meta property="og:image:alt" content="A round table seen from above, its seats around the room code">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${esc(image)}">
<link rel="icon" type="image/svg+xml" href="/icons/app-icon.svg">
<script>location.replace(${JSON.stringify(`/t/${safe}?app`)});</script>
</head>
<body style="font-family: system-ui, sans-serif; padding: 24px;">
<p><a href="/t/${esc(safe)}?app">Open the study table in THD Room Finder</a></p>
</body>
</html>`;
}
