// 공유 데이터: 메인 프롬프트 + 의상 목록. Cloudflare KV(바인딩 이름 DB)의 'state' 키 하나에 JSON으로 저장한다.
// 이 경로는 _middleware.js 가 토큰을 확인한 뒤에만 실행된다.

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ error: 'KV 바인딩 DB가 없어요' }, 503);
  const raw = await env.DB.get('state');
  return json(raw ? JSON.parse(raw) : null);
}

export async function onRequestPut({ request, env }) {
  if (!env.DB) return json({ error: 'KV 바인딩 DB가 없어요' }, 503);
  const text = await request.text();
  if (text.length > 2_000_000) return json({ error: '데이터가 너무 커요' }, 413);
  let data;
  try { data = JSON.parse(text); } catch (e) { return json({ error: 'JSON 형식이 아니에요' }, 400); }
  if (!data || !Array.isArray(data.items) || !Array.isArray(data.mains)) return json({ error: 'mains, items가 필요해요' }, 400);
  // 이미지 본문은 /api/img 에 따로 저장하므로 state 안에는 주소만 남긴다.
  for (const it of data.items) {
    if (typeof it.img === 'string' && it.img.startsWith('data:')) return json({ error: '이미지는 /api/img 로 먼저 올려 주세요' }, 400);
  }
  await env.DB.put('state', JSON.stringify(data));
  return json({ ok: true });
}
