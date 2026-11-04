// 의상 이미지 올리기: 본문으로 data URL(브라우저에서 줄인 jpeg)을 받아 KV에 바이너리로 저장한다.

const MAX_BYTES = 4 * 1024 * 1024;

export async function onRequestPost({ request, env }) {
  if (!env.DB) return new Response('KV 바인딩 DB가 없어요', { status: 503 });
  const body = await request.text();
  const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(body);
  if (!m) return new Response('이미지 형식이 아니에요', { status: 400 });
  const bin = atob(m[2]);
  if (bin.length > MAX_BYTES) return new Response('이미지가 너무 커요', { status: 413 });
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const id = crypto.randomUUID().replace(/-/g, '');
  await env.DB.put('img:' + id, bytes, { metadata: { type: m[1] } });
  return new Response(JSON.stringify({ url: '/api/img/' + id }), { headers: { 'Content-Type': 'application/json' } });
}
