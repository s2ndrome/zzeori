// 확장 아이콘 PNG 생성 (파란 문서 모양 SVG → 16/32/48/128)
const { chromium } = require('playwright');
const path = require('path');
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M6 2h14l7 7v21H6z" fill="#fff" stroke="#2b5fb3" stroke-width="2"/><path d="M20 2v7h7" fill="#cfe0f7" stroke="#2b5fb3" stroke-width="2"/><rect x="6" y="14" width="21" height="16" fill="#2b5fb3"/><path d="M10 19h13M10 23h13M10 27h8" stroke="#fff" stroke-width="2"/></svg>`;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const s of [16, 32, 48, 128]) {
    await p.setViewportSize({ width: s, height: s });
    await p.setContent(`<style>html,body{margin:0;background:transparent}</style><img src="data:image/svg+xml,${encodeURIComponent(SVG)}" width="${s}" height="${s}" style="display:block">`);
    await p.screenshot({ path: path.join(__dirname, '..', 'icons', `icon${s}.png`), omitBackground: true });
  }
  await b.close();
})();
