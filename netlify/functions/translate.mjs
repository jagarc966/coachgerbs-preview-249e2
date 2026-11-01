// Server-side fallback for the translator: same public Google endpoint, called from Netlify
// so the app still works if a browser blocks the direct request.
export default async (req) => {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').slice(0, 3000);
  const sl = /^(en|ja)$/.test(url.searchParams.get('sl') || '') ? url.searchParams.get('sl') : 'en';
  const tl = /^(en|ja)$/.test(url.searchParams.get('tl') || '') ? url.searchParams.get('tl') : 'ja';
  if (!q.trim()) return Response.json({ error: 'empty' }, { status: 400 });

  const target = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&dt=rm&dj=1&q=${encodeURIComponent(q)}`;
  try {
    const r = await fetch(target, { headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' } });
    if (!r.ok) return Response.json({ error: 'upstream ' + r.status }, { status: 502 });
    const body = await r.text();
    return new Response(body, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'access-control-allow-origin': '*' } });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }
};

export const config = { path: '/api/translate' };
