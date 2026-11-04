// 모든 요청 앞에서 토큰을 확인한다.
// 토큰 목록은 Cloudflare Pages 환경 변수 TOKENS 에 쉼표로 구분해 넣는다. (코드·저장소에는 토큰을 두지 않는다)
// 맞는 토큰을 넣은 사람만 쿠키를 받고, 쿠키가 없으면 페이지·이미지·데이터 어떤 파일도 내려보내지 않는다.

const COOKIE = 'zz_auth';
const MAX_AGE = 60 * 60 * 24 * 30; // 30일

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function tokenList(env) {
  return String(env.TOKENS || '').split(/[\s,]+/).filter(Boolean);
}

function readCookie(request, name) {
  const raw = request.headers.get('Cookie') || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return '';
}

async function isValid(env, value) {
  if (!value) return false;
  for (const t of tokenList(env)) {
    if ((await sha256('zzeori:' + t)) === value) return true;
  }
  return false;
}

const SECURITY_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

function loginPage(message, status) {
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>R♡M</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..900&family=IBM+Plex+Mono:wght@400&family=Noto+Sans+KR:wght@400;500&display=swap">
<style>
:root{--bg:#fff;--ink:#111;--mute:#7a7a7a;--err:#a12a2a}
*{box-sizing:border-box}html,body{margin:0;height:100%}
body{background:var(--bg);color:var(--ink);font-family:"Archivo","Noto Sans KR",Arial,sans-serif;display:grid;place-items:center;padding:16px}
.box{width:min(460px,100%);display:flex;flex-direction:column;gap:18px}
.menu{display:flex;gap:24px;font-size:14px}.menu .on{background:var(--ink);color:var(--bg);padding:0 4px}
h1{margin:0;font-weight:400;font-stretch:88%;font-size:clamp(64px,16vw,110px);line-height:.86;letter-spacing:-.04em}
p{margin:0;font-family:"Noto Sans KR",sans-serif;font-size:14px;line-height:1.6;color:#3b3b3b}
form{position:relative;border:1px solid var(--ink);padding:6px;display:flex;gap:6px}
form:focus-within{box-shadow:4px 4px 0 var(--ink)}
.h{position:absolute;width:9px;height:9px;background:var(--bg);border:1px solid var(--ink)}
input{flex:1;min-width:0;border:0;font-family:"IBM Plex Mono",monospace;font-size:15px;padding:10px;background:transparent;outline:none}
button{border:0;background:var(--ink);color:var(--bg);padding:0 18px;font-size:14px;cursor:pointer}
.err{color:var(--err);font-family:"Noto Sans KR",sans-serif;font-size:13px;min-height:1.2em}
</style></head><body><main class="box">
<div class="menu"><span>file</span><span>open</span><span class="on">token</span></div>
<h1>R♡M</h1>
<p>초대받은 사람만 볼 수 있는 프롬프트 보관함이에요. 받은 토큰을 입력해 주세요.</p>
<form method="post" action="/__login" autocomplete="off">
<i class="h" style="top:-5px;left:-5px"></i><i class="h" style="top:-5px;right:-5px"></i><i class="h" style="bottom:-5px;left:-5px"></i><i class="h" style="bottom:-5px;right:-5px"></i>
<input name="token" type="password" placeholder="토큰 입력" aria-label="토큰" required autofocus spellcheck="false">
<button type="submit">입장</button></form>
<div class="err" role="alert">${message}</div>
</main></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', ...SECURITY_HEADERS } });
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  if (url.pathname === '/__logout') {
    return new Response(null, {
      status: 302,
      headers: { Location: '/', 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`, ...SECURITY_HEADERS },
    });
  }

  if (url.pathname === '/__login' && request.method === 'POST') {
    let token = '';
    try { token = String((await request.formData()).get('token') || '').trim(); } catch (e) { /* 빈 요청 */ }
    if (token && tokenList(env).includes(token)) {
      const value = await sha256('zzeori:' + token);
      return new Response(null, {
        status: 302,
        headers: { Location: '/', 'Set-Cookie': `${COOKIE}=${value}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`, ...SECURITY_HEADERS },
      });
    }
    return loginPage(token ? '토큰이 맞지 않아요. 받은 토큰을 다시 확인해 주세요.' : '토큰을 입력해 주세요.', 401);
  }

  if (await isValid(env, readCookie(request, COOKIE))) {
    const res = await next();
    const out = new Response(res.body, res);
    out.headers.set('X-Robots-Tag', 'noindex, nofollow');
    if (!out.headers.has('Cache-Control')) out.headers.set('Cache-Control', 'private, no-cache');
    return out;
  }

  if (url.pathname.startsWith('/api/')) {
    return new Response('토큰이 필요해요', { status: 401, headers: SECURITY_HEADERS });
  }
  return loginPage('', 401);
}
