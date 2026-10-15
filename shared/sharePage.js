import { hoursText } from './shareLink.js';

// The page behind a focus graph share link (ADR 0003). Chat apps read the
// og: tags and show the graph from /api/card as the preview; a person opening
// the link goes straight to the app's campus map. Crawlers don't run scripts,
// so the redirect is a script.

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function sharePage(s, payload, origin) {
  const de = s?.lang === 'de';
  const who = s ? [s.name, s.batch].filter(Boolean).join(' · ') : '';
  const hours = s ? hoursText(s.minutes, s.lang) : '';
  const title = !s
    ? 'THD Room Finder'
    : de
      ? `${who || 'Jemand an der THD'}: ${hours} Fokus in diesem Semester`
      : `${who || 'A THD student'}: ${hours} of focus this semester`;
  const description = de
    ? 'Finde einen freien Lernraum an der THD Deggendorf und fokussiere dich dort, allein oder mit deinem Jahrgang. Kostenlos, ohne Konto.'
    : 'Find a free study room at THD Deggendorf and focus in it, alone or with your batch. Free, no account needed.';
  const image = s ? `${origin}/api/card?p=${payload}` : `${origin}/og.jpg`;
  const alt = s
    ? de
      ? `Fokus-Verlauf${who ? ` von ${who}` : ''}: ${hours} in diesem Semester, ${s.streak} Tage in Folge.`
      : `Focus graph${who ? ` of ${who}` : ''}: ${hours} this semester, ${s.streak}-day streak.`
    : 'THD Room Finder';

  return `<!DOCTYPE html>
<html lang="${de ? 'de' : 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="noindex">
<meta property="og:type" content="website">
<meta property="og:site_name" content="THD Room Finder">
<meta property="og:url" content="${esc(`${origin}/f/${payload}`)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${esc(image)}">
<link rel="icon" type="image/svg+xml" href="/icons/app-icon.svg">
<script>location.replace('/');</script>
</head>
<body style="font-family: system-ui, sans-serif; padding: 24px;">
<p><a href="/">${de ? 'THD Room Finder öffnen' : 'Open THD Room Finder'}</a></p>
</body>
</html>`;
}
