// 사용법: node shoot.js <테스트.html> <출력폴더> [설정 JSON]
// 1440×900, 1024×768, 390×844 스크린샷 + 상태 표시줄 값/남은 색·이탤릭 점검
const { chromium } = require('playwright');
const path = require('path');
const [, , page, outDir, settingsJson, tag] = process.argv;
(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const sizes = [[1440, 900], [1024, 768], [390, 844]];
  for (const [w, h] of sizes) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    // 외부 네트워크 차단 (file:// 만 허용)
    await p.route('**/*', (r) => (r.request().url().startsWith('file:') || r.request().url().startsWith('data:') ? r.continue() : r.abort()));
    p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
    if (settingsJson) await p.addInitScript((s) => { localStorage.setItem('hwpSkin', s); localStorage.setItem('__hwp_stub', JSON.stringify({ hwpSkin: JSON.parse(s) })); }, settingsJson);
    await p.goto('file://' + path.resolve(page), { waitUntil: 'load' });
    await p.waitForTimeout(1600);
    const info = await p.evaluate(() => {
      const st = [...document.querySelectorAll('#hwp-bottom .hwp-st')].map((e) => e.textContent).join(' | ');
      const bad = [];
      document.querySelectorAll('#chat-content-panel [data-chat-excerpt]').forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.color !== 'rgb(0, 0, 0)' && cs.color !== 'rgb(51, 51, 51)') bad.push('color ' + cs.color);
        if (cs.fontStyle !== 'normal') bad.push('italic');
      });
      return { title: document.title, status: st, bad: [...new Set(bad)].slice(0, 5), tabs: document.querySelectorAll('.hwp-tab').length };
    });
    console.log(w + 'x' + h, JSON.stringify(info));
    await p.screenshot({ path: path.join(outDir, `${tag || 'shot'}-${w}.png`) });
    if (w === 1440) {
      // 맨 위(문서 제목)까지 스크롤 — 역방향 스크롤이라 scrollTop을 음수로
      await p.evaluate(() => { const sc = document.querySelector('#chat-content-panel .flex-col-reverse.overflow-y-auto'); sc.scrollTop = -sc.scrollHeight; });
      await p.waitForTimeout(400);
      console.log('  top:', await p.evaluate(() => document.querySelector('[data-hwp="st-page"]').textContent));
      await p.screenshot({ path: path.join(outDir, `${tag || 'shot'}-${w}-top.png`) });
    }
    await ctx.close();
  }
  await browser.close();
})();
