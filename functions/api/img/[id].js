// 의상 이미지 보기 / 지우기

export async function onRequestGet({ params, env }) {
  if (!env.DB) return new Response('KV 바인딩 DB가 없어요', { status: 503 });
  const id = String(params.id || '');
  if (!/^[a-f0-9]{32}$/.test(id)) return new Response('없는 이미지예요', { status: 404 });
  const { value, metadata } = await env.DB.getWithMetadata('img:' + id, 'arrayBuffer');
  if (!value) return new Response('없는 이미지예요', { status: 404 });
  return new Response(value, {
    headers: { 'Content-Type': (metadata && metadata.type) || 'image/jpeg', 'Cache-Control': 'private, max-age=31536000, immutable' },
  });
}

export async function onRequestDelete({ params, env }) {
  if (!env.DB) return new Response('KV 바인딩 DB가 없어요', { status: 503 });
  const id = String(params.id || '');
  if (/^[a-f0-9]{32}$/.test(id)) await env.DB.delete('img:' + id);
  return new Response(null, { status: 204 });
}
