import { decodeShare } from '../shared/shareLink.js';
import { invitePage, parseInvite, sharePage } from '../shared/sharePage.js';

// Two kinds of link, both pages whose og: tags make the chat preview and
// whose script sends people to the campus map (ADR 0003):
//   /f/<payload> → /api/share?p=<payload>  the focus graph (shared/sharePage.js)
//   /i/<variant> → /api/share?i=<variant>  an invite with the app's banner

export function GET(request) {
  const url = new URL(request.url);
  const variant = url.searchParams.get('i');
  let html;
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
