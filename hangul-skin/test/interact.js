// 사용법: node interact.js <테스트.html> <출력폴더> <hangul-skin 폴더>
const { chromium } = require('playwright');
const path = require('path');
const [, , page, outDir, skinDir] = process.argv;
const ok = (c, m) => console.log((c ? '  ✔ ' : '  ✘ ') + m);
(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.route('**/*', (r) => (/^(file|data):/.test(r.request().url()) ? r.continue() : r.abort()));
  p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await p.goto('file://' + path.resolve(page));
  await p.waitForTimeout(1200);
  const shot = (n) => p.screenshot({ path: path.join(outDir, n + '.png') });
  const scrollTo = (sel) => p.evaluate((s) => { const el = document.querySelectorAll(s)[0]; el.scrollIntoView({ block: 'center' }); }, sel);

  console.log('카드 접기/펼치기');
  await scrollTo('[id^="chat-message-"] .bg-background-markdown\\/80');
  await p.waitForTimeout(200);
  const card = p.locator('[id^="chat-message-"] .bg-background-markdown\\/80').first();
  ok((await card.boundingBox()).height < 40, '접힌 카드는 캡션 한 줄 높이');
  await card.click({ position: { x: 30, y: 8 } });
  ok(await card.getAttribute('data-hwp-open') === '1', '클릭하면 펼침 (data-hwp-open)');
  ok((await card.boundingBox()).height > 100, '펼친 카드 높이 ' + Math.round((await card.boundingBox()).height));
  await shot('i-card-open');
  await card.click({ position: { x: 30, y: 8 } });
  ok(await card.getAttribute('data-hwp-open') === null, '캡션 다시 클릭하면 접힘');

  console.log('리본 글자 크기/줄 간격');
  const fs0 = await p.evaluate(() => getComputedStyle(document.querySelector('[data-chat-excerpt="narration"]')).fontSize);
  await p.click('[data-hwp="fontup"]'); await p.click('[data-hwp="fontup"]');
  await p.waitForTimeout(100);
  const fs1 = await p.evaluate(() => getComputedStyle(document.querySelector('[data-chat-excerpt="narration"]')).fontSize);
  ok(fs0 !== fs1, `글자 크기 ${fs0} → ${fs1}`);
  ok(await p.inputValue('[data-hwp="fontsel"]') === '12', '크기 콤보 12.0 pt');
  await p.selectOption('[data-hwp="linesel"]', '200');
  ok(await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--hwp-lh').trim()) === '2', '줄 간격 200 %');
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem('hwpSkin')).fontPt) === 12, 'localStorage 저장');
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem('__hwp_stub')).hwpSkin.fontPt) === 12, 'chrome.storage 저장');
  await shot('i-font12');
  await p.evaluate(() => window.__hwpSkin.set({ fontPt: 10, lineH: 160 }));

  console.log('옵션 변형');
  await p.evaluate(() => { const sc = document.querySelector('#chat-content-panel .flex-col-reverse.overflow-y-auto'); sc.scrollTop = -sc.scrollHeight; });
  await p.evaluate(() => window.__hwpSkin.set({ memo: 'quote', img: 'small' })); await p.waitForTimeout(300); await shot('i-quote-img');
  await p.evaluate(() => window.__hwpSkin.set({ memo: 'shade', nav: 'show' })); await p.waitForTimeout(300); await shot('i-shade-nav');
  await p.evaluate(() => window.__hwpSkin.set({ memo: 'memo', img: 'hide', nav: 'hide', card: 'gray' }));
  await scrollTo('[id^="chat-message-"] > .isolate'); await p.waitForTimeout(300); await shot('i-card-gray');
  await p.evaluate(() => window.__hwpSkin.set({ card: 'collapse', fileFmt: '{캐릭터}_최종.hwp' })); await p.waitForTimeout(1300);
  ok((await p.title()) === '신드롬_최종.hwp - 한글', '파일 이름 형식: ' + await p.title());
  ok((await p.textContent('.hwp-tab.on .hwp-tab-name')) === '신드롬_최종.hwp', '탭 이름도 반영');
  await p.evaluate(() => window.__hwpSkin.set({ fileFmt: '{캐릭터}.hwp' }));

  console.log('문서 탭 클릭 → 원래 링크 click()');
  await p.evaluate(() => { window.__clicked = ''; document.querySelectorAll('nav.w-64 a').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); window.__clicked = a.getAttribute('aria-label'); })); });
  await p.click('.hwp-tab:nth-child(2)');
  ok(await p.evaluate(() => window.__clicked) === '해일', '두 번째 탭 → "해일" 링크 클릭됨');

  console.log('보스 키');
  await p.keyboard.press('Alt+KeyQ'); await p.waitForTimeout(200);
  ok(await p.isVisible('#hwp-boss'), '보스 화면 표시');
  ok((await p.title()).startsWith('2026년 하반기'), '탭 제목: ' + await p.title());
  await shot('i-boss');
  await p.keyboard.press('Alt+KeyQ'); await p.waitForTimeout(200);
  ok(!(await p.isVisible('#hwp-boss')), '다시 누르면 걷힘');
  ok((await p.title()) === '신드롬.hwp - 한글', '제목 복원');

  console.log('끄기 → 원래 화면');
  await p.evaluate(() => window.__hwpSkin.set({ on: false })); await p.waitForTimeout(300);
  ok(await p.evaluate(() => [...document.documentElement.attributes].every((a) => !a.name.startsWith('data-hwp'))), 'html에 data-hwp-* 없음');
  ok(await p.evaluate(() => !document.querySelector('[id^="hwp-"]')), '#hwp-* 요소 없음');
  ok((await p.title()) === '신드롬 | 케이브덕', '원래 제목: ' + await p.title());
  ok(await p.evaluate(() => !!document.querySelector('link[rel~="icon"]') && !document.querySelector('[rel="hwp-hidden-icon"]')), '원래 파비콘 복원');
  await shot('i-off');
  await p.evaluate(() => window.__hwpSkin.set({ on: true })); await p.waitForTimeout(400);
  ok(await p.isVisible('#hwp-top'), '다시 켜기');

  // 팝업
  const pp = await ctx.newPage();
  await pp.setViewportSize({ width: 300, height: 640 });
  await pp.addInitScript(() => {
    const store = { hwpSkin: { on: true, memo: 'memo', card: 'collapse', img: 'hide', fontPt: 10, lineH: 160, nav: 'hide', fileFmt: '{캐릭터}.hwp', indent: false, bold: true, zoom: 100, boss: true } };
    window.chrome = { runtime: { getManifest: () => ({ version: '1.0.0' }) }, storage: { local: { get: (k, cb) => cb(store), set: (o) => Object.assign(store, o) }, onChanged: { addListener() {} } } };
  });
  await pp.goto('file://' + path.resolve(skinDir, 'popup.html'));
  await pp.waitForTimeout(200);
  await pp.screenshot({ path: path.join(outDir, 'i-popup.png'), fullPage: true });
  await browser.close();
})();
