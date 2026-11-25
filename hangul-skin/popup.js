// 한글 스킨 팝업: chrome.storage.local의 hwpSkin 값을 읽고 쓴다. (content.js가 onChanged로 바로 반영)
(() => {
  'use strict';
  const KEY = 'hwpSkin';
  const DEFAULTS = {
    on: true, memo: 'memo', card: 'collapse', img: 'hide', fontPt: 10, lineH: 160,
    nav: 'hide', fileFmt: '{캐릭터}.hwp', indent: false, bold: true, zoom: 100, boss: true,
  };
  let S = Object.assign({}, DEFAULTS);
  const $ = (id) => document.getElementById(id);

  function render() {
    $('on').checked = !!S.on;
    $('boss').checked = !!S.boss;
    $('memo').value = S.memo;
    $('card').value = S.card;
    $('bold').checked = !!S.bold;
    $('indent').checked = !!S.indent;
    $('fontPt').value = S.fontPt;
    $('lineH').value = S.lineH;
    $('zoom').value = S.zoom;
    if (document.activeElement !== $('fileFmt')) $('fileFmt').value = S.fileFmt;
    document.querySelectorAll('.seg').forEach((seg) => {
      seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === S[seg.dataset.key]));
    });
    document.body.classList.toggle('off', !S.on);
  }

  function save(patch) {
    S = Object.assign({}, S, patch);
    chrome.storage.local.set({ [KEY]: S });
    render();
  }

  chrome.storage.local.get(KEY, (r) => { S = Object.assign({}, DEFAULTS, (r && r[KEY]) || {}); render(); });
  chrome.storage.onChanged.addListener((ch, area) => {
    if (area === 'local' && ch[KEY] && ch[KEY].newValue) { S = Object.assign({}, DEFAULTS, ch[KEY].newValue); render(); }
  });

  ['on', 'boss', 'bold', 'indent'].forEach((k) => $(k).addEventListener('change', (e) => save({ [k]: e.target.checked })));
  ['memo', 'card'].forEach((k) => $(k).addEventListener('change', (e) => save({ [k]: e.target.value })));
  [['fontPt', 7, 24], ['lineH', 80, 300], ['zoom', 50, 200]].forEach(([k, lo, hi]) => {
    $(k).addEventListener('change', (e) => {
      const v = Number(e.target.value);
      if (!isFinite(v)) { render(); return; }
      save({ [k]: Math.min(hi, Math.max(lo, v)) });
    });
  });
  let t = 0;
  $('fileFmt').addEventListener('input', (e) => {
    clearTimeout(t);
    t = setTimeout(() => save({ fileFmt: e.target.value.trim() || DEFAULTS.fileFmt }), 300);
  });
  document.querySelectorAll('.seg').forEach((seg) => seg.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) save({ [seg.dataset.key]: b.dataset.v });
  }));
  $('reset').addEventListener('click', () => save(Object.assign({}, DEFAULTS)));
  try { $('ver').textContent = 'v' + chrome.runtime.getManifest().version; } catch (e) {}
})();
