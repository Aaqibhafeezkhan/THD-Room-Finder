import { decodeShare } from '../shared/shareLink.js';
import { sharePage } from '../shared/sharePage.js';

// GET /f/<payload>, rewritten to /api/share?p=<payload>: a focus graph share
// link (ADR 0003). See shared/sharePage.js.

export function GET(request) {
  const url = new URL(request.url);
  const payload = url.searchParams.get('p') ?? '';
  const snapshot = decodeShare(payload);
  return new Response(sharePage(snapshot, snapshot ? payload : '', url.origin), {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
