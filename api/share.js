import { decodeShare } from '../shared/shareLink.js';
import { invitePage, parseInvite, sharePage } from '../shared/sharePage.js';
import { isTableLink, tablePage } from '../shared/tablePage.js';

// Two kinds of link, both pages whose og: tags make the chat preview and
// whose script sends people to the campus map (ADR 0003):
//   /f/<payload> → /api/share?p=<payload>  the focus graph (shared/sharePage.js)
//   /i/<variant> → /api/share?i=<variant>  an invite with the app's banner
//   /t/<link>    → /api/share?t=<link>     a study table (ADR 0007); the page
//                                          sends people on to /t/<link>?app

// The publishable key only: table_preview needs no sign-in and returns no
// names.
async function tablePreviewFor(link) {
  const base = (process.env.VITE_SUPABASE_URL ?? '').trim();
  const key = (process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim();
  if (!base || !key || !isTableLink(link)) return null;
  try {
    const res = await fetch(`${base}/rest/v1/rpc/table_preview`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_link: link }),
      signal: AbortSignal.timeout(4000),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export async function GET(request) {
  const url = new URL(request.url);
  const variant = url.searchParams.get('i');
  const table = url.searchParams.get('t');
  let html;
  if (table !== null) {
    const link = table.trim().toLowerCase();
    html = tablePage(await tablePreviewFor(link), link, url.origin);
    return new Response(html, {
      status: 200,
      // Seats change as people reply; keep previews fresh.
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
    });
  }
  if (variant !== null) {
    html = invitePage(parseInvite(variant), url.origin);
  } else {
    const payload = url.searchParams.get('p') ?? '';
    const snapshot = decodeShare(payload);
    html = sharePage(snapshot, snapshot ? payload : '', url.origin);
  }
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
