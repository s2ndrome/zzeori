/* 케이브덕 → 한글(HWP) 편집 창 스킨
 * - <html data-hwp-theme> 아래에서만 theme.css가 적용된다. 끄면 속성을 지워 원래 화면으로.
 * - React가 관리하는 노드는 지우거나 옮기지 않는다. 새 UI는 id="hwp-..." 요소를 body에 따로 붙인다.
 * - document_start에서 실행: localStorage로 설정을 바로 읽어 깜빡임을 막고, chrome.storage와 동기화한다.
 */
(() => {
  'use strict';
  if (window.__hwpSkinLoaded) return;
  window.__hwpSkinLoaded = true;

  // ───────────────────────── 설정 ─────────────────────────
  const KEY = 'hwpSkin';
  const DEFAULTS = {
    on: true,          // 스킨 켜기
    memo: 'memo',      // 내 메시지: memo | shade | quote | hide
    card: 'collapse',  // 상태창·HTML 카드: collapse | gray | show | hide
    img: 'hide',       // 캐릭터 이미지: hide | small
    fontPt: 10,        // 글자 크기(pt)
    lineH: 160,        // 줄 간격(%)
    nav: 'hide',       // 왼쪽 메뉴: hide | show
    fileFmt: '{캐릭터}.hwp',
    indent: false,     // 문단 첫 줄 들여쓰기
    bold: true,        // 대사 살짝 굵게
    zoom: 100,         // 확대 비율(%)
    boss: true,        // 보스 키(Alt+Q)
  };
  const FONT_MIN = 7, FONT_MAX = 24;
  const PAGE_H = 1123; // A4 297mm @96dpi (theme.css의 쪽 구분 배경과 같은 값)

  const root = document.documentElement;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const fixS = (o) => {
    const s = Object.assign({}, DEFAULTS, o || {});
    s.fontPt = clamp(Math.round(Number(s.fontPt) * 2) / 2 || 10, FONT_MIN, FONT_MAX);
    s.lineH = clamp(Math.round(Number(s.lineH)) || 160, 80, 300);
    s.zoom = clamp(Math.round(Number(s.zoom)) || 100, 50, 200);
    if (typeof s.fileFmt !== 'string' || !s.fileFmt.trim()) s.fileFmt = DEFAULTS.fileFmt;
    return s;
  };
  const readLocal = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
  const writeLocal = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
  const hasChrome = () => { try { return !!(window.chrome && chrome.storage && chrome.storage.local); } catch (e) { return false; } };

  let S = fixS(readLocal());

  function setSetting(patch) {
    S = fixS(Object.assign({}, S, patch));
    writeLocal(S);
    applyAll();
    if (hasChrome()) { try { chrome.storage.local.set({ [KEY]: S }); } catch (e) {} }
  }

  if (hasChrome()) {
    try {
      chrome.storage.local.get(KEY, (r) => {
        if (r && r[KEY]) {
          const n = fixS(r[KEY]);
          if (JSON.stringify(n) !== JSON.stringify(S)) { S = n; writeLocal(S); applyAll(); }
        } else {
          chrome.storage.local.set({ [KEY]: S });
        }
      });
      chrome.storage.onChanged.addListener((ch, area) => {
        if (area !== 'local' || !ch[KEY] || !ch[KEY].newValue) return;
        const n = fixS(ch[KEY].newValue);
        if (JSON.stringify(n) === JSON.stringify(S)) return;
        S = n; writeLocal(S); applyAll();
      });
    } catch (e) {}
  }

  // ───────────────────────── 페이지 판별 ─────────────────────────
  const getPath = () => window.__HWP_TEST_PATH__ || location.pathname; // 테스트 페이지용 덮어쓰기
  const isTalk = () => /\/talk\/[^/]+/.test(getPath());
  const talkId = () => { const m = getPath().match(/\/talk\/([^/?#]+)/); return m ? m[1] : ''; };

  // ───────────────────────── 셀렉터 ─────────────────────────
  const SEL = {
    header: 'main header',
    name: 'main header nav > button.truncate',
    scroller: '#chat-content-panel .flex-col-reverse.overflow-y-auto',
    paper: '#chat-content-panel .flex-col-reverse.overflow-y-auto > div',
    composer: '#chat-content-panel [data-chat-composer]',
    textbox: '[data-chat-composer] [role="textbox"][contenteditable]',
    recent: 'nav.w-64 ul li a[href*="/talk/"]',
    bgImg: '#chat-background-panel img',
    cards: '[id^="chat-message-"] > .isolate, [id^="chat-message-"] .bg-background-markdown\\/80',
  };
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  // ───────────────────────── 아이콘 (직접 그린 SVG) ─────────────────────────
  const svg = (w, h, body, vb) => `<svg width="${w}" height="${h}" viewBox="${vb || `0 0 ${w} ${h}`}" aria-hidden="true" focusable="false">${body}</svg>`;
  const DOC_ICON = (s) => svg(s, s, '<path d="M3 1.5h7l3.5 3.5v9.5H3z" fill="#fff" stroke="#2f6bc4"/><path d="M10 1.5V5h3.5" fill="#dbe7f8" stroke="#2f6bc4"/><rect x="3" y="7" width="10.5" height="7.5" fill="#2f6bc4"/><path d="M5 9h6.5M5 11h6.5M5 13h4" stroke="#fff" stroke-width="1"/>', '0 0 16 16');
  const I = {
    doc: DOC_ICON(16),
    save: svg(16, 16, '<rect x="2.5" y="2.5" width="11" height="11" rx="1" fill="#3d73c7"/><rect x="4.5" y="2.5" width="7" height="4" fill="#fff"/><rect x="4" y="9" width="8" height="4.5" fill="#e8eef8"/>'),
    undo: svg(16, 16, '<path d="M5 6h5a3 3 0 0 1 0 6H7" fill="none" stroke="#555" stroke-width="1.4"/><path d="M5 3L2 6l3 3z" fill="#555"/>'),
    redo: svg(16, 16, '<path d="M11 6H6a3 3 0 0 0 0 6h3" fill="none" stroke="#555" stroke-width="1.4"/><path d="M11 3l3 3-3 3z" fill="#555"/>'),
    print: svg(16, 16, '<rect x="4" y="2.5" width="8" height="4" fill="#fff" stroke="#666"/><rect x="2" y="6" width="12" height="5.5" rx="1" fill="#8a8a8a"/><rect x="4" y="9.5" width="8" height="4.5" fill="#fff" stroke="#666"/>'),
    min: svg(10, 10, '<path d="M0 5.5h10" stroke="#333"/>'),
    max: svg(10, 10, '<rect x=".5" y=".5" width="9" height="9" fill="none" stroke="#333"/>'),
    close: svg(10, 10, '<path d="M0 0l10 10M10 0L0 10" stroke="#333"/>'),
    paste: svg(32, 32, '<rect x="6" y="5" width="17" height="22" rx="1.5" fill="#c9a36a" stroke="#8b6a35"/><rect x="10" y="3" width="9" height="5" rx="1" fill="#eee" stroke="#777"/><path d="M14 12h12l3 3v14H14z" fill="#fff" stroke="#2f6bc4"/><path d="M17 18h9M17 21h9M17 24h6" stroke="#2f6bc4"/>'),
    cut: svg(16, 16, '<circle cx="4.5" cy="12" r="2.2" fill="none" stroke="#444" stroke-width="1.2"/><circle cx="11.5" cy="12" r="2.2" fill="none" stroke="#444" stroke-width="1.2"/><path d="M5.8 10.3L11 2M10.2 10.3L5 2" stroke="#444" stroke-width="1.2"/>'),
    copy: svg(16, 16, '<rect x="2" y="2" width="8" height="10" fill="#fff" stroke="#666"/><rect x="6" y="5" width="8" height="10" fill="#fff" stroke="#2f6bc4"/><path d="M8 8h4M8 10h4M8 12h3" stroke="#2f6bc4"/>'),
    brush: svg(16, 16, '<rect x="2" y="2" width="10" height="4" rx="1" fill="#f2c12e" stroke="#a37d00"/><path d="M12 4h2v4H8v2" fill="none" stroke="#666"/><rect x="6.8" y="10" width="2.4" height="5" fill="#666"/>'),
    charShape: svg(32, 32, '<text x="3" y="23" font-size="20" font-weight="700" fill="#222" font-family="Malgun Gothic,Apple SD Gothic Neo,sans-serif">가</text><text x="20" y="28" font-size="11" fill="#2f6bc4" font-family="Arial">A</text>'),
    paraShape: svg(32, 32, '<path d="M6 7h20M10 12h16M10 17h16M6 22h20M6 27h14" stroke="#444" stroke-width="1.6"/><path d="M3 10l3 2-3 2z" fill="#2f6bc4"/>'),
    style: svg(32, 32, '<rect x="4" y="5" width="24" height="22" fill="#fff" stroke="#888"/><text x="7" y="17" font-size="10" fill="#222" font-family="Malgun Gothic,sans-serif">가나</text><path d="M7 21h18M7 24h12" stroke="#2f6bc4" stroke-width="1.4"/>'),
    outline: svg(32, 32, '<text x="3" y="11" font-size="8" fill="#2f6bc4" font-family="Arial">1.</text><path d="M12 8h16" stroke="#444" stroke-width="1.6"/><text x="7" y="19" font-size="8" fill="#2f6bc4" font-family="Arial">가.</text><path d="M17 16h11" stroke="#444" stroke-width="1.6"/><text x="11" y="27" font-size="8" fill="#2f6bc4" font-family="Arial">1)</text><path d="M20 24h8" stroke="#444" stroke-width="1.6"/>'),
    table: svg(32, 32, '<rect x="4" y="6" width="24" height="20" fill="#fff" stroke="#555"/><path d="M4 12h24M4 19h24M12 6v20M20 6v20" stroke="#555"/><rect x="4" y="6" width="24" height="6" fill="#bcd3f2" opacity=".7"/>'),
    picture: svg(32, 32, '<rect x="4" y="6" width="24" height="20" fill="#fff" stroke="#555"/><circle cx="11" cy="12" r="2.5" fill="#f0b429"/><path d="M5 25l8-8 5 5 4-4 6 7" fill="#5f9e4f"/>'),
    aLeft: svg(16, 16, '<path d="M2 3h12M2 6h8M2 9h12M2 12h8" stroke="#444" stroke-width="1.3"/>'),
    aCenter: svg(16, 16, '<path d="M2 3h12M4 6h8M2 9h12M4 12h8" stroke="#444" stroke-width="1.3"/>'),
    aRight: svg(16, 16, '<path d="M2 3h12M6 6h8M2 9h12M6 12h8" stroke="#444" stroke-width="1.3"/>'),
    aJustify: svg(16, 16, '<path d="M2 3h12M2 6h12M2 9h12M2 12h12" stroke="#444" stroke-width="1.3"/>'),
    lineSp: svg(16, 16, '<path d="M7 3h7M7 6.5h7M7 10h7M7 13.5h7" stroke="#444" stroke-width="1.2"/><path d="M3 2l2 2.5H1zM3 14l2-2.5H1z" fill="#2f6bc4"/><path d="M3 4v8" stroke="#2f6bc4"/>'),
    bullets: svg(16, 16, '<circle cx="3" cy="4" r="1.3" fill="#2f6bc4"/><circle cx="3" cy="8" r="1.3" fill="#2f6bc4"/><circle cx="3" cy="12" r="1.3" fill="#2f6bc4"/><path d="M6 4h8M6 8h8M6 12h8" stroke="#444" stroke-width="1.2"/>'),
    numbers: svg(16, 16, '<text x="0" y="6" font-size="5.5" fill="#2f6bc4" font-family="Arial">1</text><text x="0" y="13" font-size="5.5" fill="#2f6bc4" font-family="Arial">2</text><path d="M6 4h8M6 11h8" stroke="#444" stroke-width="1.2"/>'),
    indentL: svg(16, 16, '<path d="M2 3h12M7 6.5h7M7 10h7M2 13.5h12" stroke="#444" stroke-width="1.2"/><path d="M5 8.2L2 6v4.4z" fill="#2f6bc4"/>'),
    indentR: svg(16, 16, '<path d="M2 3h12M7 6.5h7M7 10h7M2 13.5h12" stroke="#444" stroke-width="1.2"/><path d="M2 8.2L5 6v4.4z" fill="#2f6bc4"/>'),
    up: svg(7, 4, '<path d="M0 4L3.5 0 7 4z" fill="#444"/>'),
    down: svg(7, 4, '<path d="M0 0l3.5 4L7 0z" fill="#444"/>'),
    caret: svg(7, 4, '<path d="M0 0l3.5 4L7 0z" fill="#555"/>'),
    highlight: svg(16, 16, '<path d="M4 10l5-7 3 2-5 7H4z" fill="#fff" stroke="#555"/><rect x="2" y="13" width="12" height="2.5" fill="#ffe34d"/>'),
    viewPage: svg(14, 14, '<rect x="3" y="1.5" width="8" height="11" fill="#fff" stroke="#555"/>'),
    viewTwo: svg(14, 14, '<rect x=".5" y="1.5" width="6" height="11" fill="#fff" stroke="#555"/><rect x="7.5" y="1.5" width="6" height="11" fill="#fff" stroke="#555"/>'),
    viewWide: svg(14, 14, '<rect x="1" y="3" width="12" height="8" fill="#fff" stroke="#555"/><path d="M3 5.5h8M3 8h6" stroke="#999"/>'),
    left: svg(8, 8, '<path d="M6 0v8L1 4z" fill="#555"/>'),
    right: svg(8, 8, '<path d="M2 0v8l5-4z" fill="#555"/>'),
    plus: svg(10, 10, '<path d="M5 0v10M0 5h10" stroke="#555" stroke-width="1.4"/>'),
    minus: svg(10, 10, '<path d="M0 5h10" stroke="#555" stroke-width="1.4"/>'),
    x: svg(8, 8, '<path d="M1 1l6 6M7 1L1 7" stroke="#777" stroke-width="1.2"/>'),
    search: svg(14, 14, '<circle cx="6" cy="6" r="4" fill="none" stroke="#555" stroke-width="1.3"/><path d="M9 9l4 4" stroke="#555" stroke-width="1.5"/>'),
    help: svg(14, 14, '<circle cx="7" cy="7" r="6" fill="none" stroke="#555"/><text x="4.6" y="10.4" font-size="9" fill="#555" font-family="Arial" font-weight="700">?</text>'),
  };
  const FAVICON = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M6 2h14l7 7v21H6z" fill="#fff" stroke="#2b5fb3" stroke-width="2"/><path d="M20 2v7h7" fill="#cfe0f7" stroke="#2b5fb3" stroke-width="2"/><rect x="6" y="14" width="21" height="16" fill="#2b5fb3"/><path d="M10 19h13M10 23h13M10 27h8" stroke="#fff" stroke-width="2"/></svg>');

  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cssStr = (t) => '"' + String(t).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ') + '"';
  const today = () => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}. ${p(d.getMonth() + 1)}. ${p(d.getDate())}.`; };
  const fileName = (name) => S.fileFmt.split('{캐릭터}').join(name || '문서1');

  // ───────────────────────── 화면 조각 (제목줄·메뉴·리본·눈금자) ─────────────────────────
  const MENUS = ['파일', '편집', '보기', '입력', '서식', '쪽', '보안', '검토', '도구'];
  const FONT_OPTS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24];
  const LINE_OPTS = [100, 130, 145, 160, 180, 200, 230, 260, 300];
  const fmtPt = (v) => Number(v).toFixed(1) + ' pt';

  function topHTML(file, live) {
    const big = (ico, label) => `<span class="hwp-big">${ico}<span>${label}</span></span>`;
    const sm = (ico, label) => `<span class="hwp-sm">${ico}<span>${label}</span></span>`;
    const ib = (ico, t) => `<span class="hwp-ib" title="${t}">${ico}</span>`;
    const g = (t) => `<span class="hwp-tg${t ? ' ' + t : ''}">`;
    const fontSel = live
      ? `<select class="hwp-combo-sel" data-hwp="fontsel" title="글자 크기">${FONT_OPTS.concat(FONT_OPTS.includes(S.fontPt) ? [] : [S.fontPt]).sort((a, b) => a - b).map((v) => `<option value="${v}"${v === S.fontPt ? ' selected' : ''}>${fmtPt(v)}</option>`).join('')}</select>`
      : `<span class="hwp-combo-txt">10.0 pt</span>`;
    const lineSel = live
      ? `<select class="hwp-combo-sel" data-hwp="linesel" title="줄 간격">${LINE_OPTS.concat(LINE_OPTS.includes(S.lineH) ? [] : [S.lineH]).sort((a, b) => a - b).map((v) => `<option value="${v}"${v === S.lineH ? ' selected' : ''}>${v} %</option>`).join('')}</select>`
      : `<span class="hwp-combo-txt">160 %</span>`;
    return `
<div class="hwp-titlebar">
  <span class="hwp-qa">${I.doc}<span class="hwp-qa-sep"></span>${ib(I.save, '저장하기')}${ib(I.print, '인쇄')}${ib(I.undo, '되돌리기')}${ib(I.redo, '다시 실행')}</span>
  <span class="hwp-title-text" data-hwp="title">${esc(file)} - 한글</span>
  <span class="hwp-win"><span title="최소화">${I.min}</span><span title="최대화">${I.max}</span><span class="hwp-win-x" title="닫기">${I.close}</span></span>
</div>
<div class="hwp-menubar">
  ${MENUS.map((m) => `<span class="hwp-menu${m === '서식' ? ' on' : ''}">${m}</span>`).join('')}
  <span class="hwp-menu-fill"></span>
  <span class="hwp-menu-right">${I.search}<span>찾기</span>${I.help}</span>
</div>
<div class="hwp-ribbon">
  ${g()}${big(I.paste, '붙이기')}<span class="hwp-col">${sm(I.cut, '오려 두기')}${sm(I.copy, '복사하기')}${sm(I.brush, '모양 복사')}</span></span>
  ${g()}${big(I.charShape, '글자 모양')}${big(I.paraShape, '문단 모양')}${big(I.style, '스타일')}</span>
  ${g()}${big(I.outline, '개요')}${big(I.table, '표')}${big(I.picture, '그림')}</span>
  ${g('hwp-tg-last')}<span class="hwp-col">${sm(I.bullets, '글머리표')}${sm(I.numbers, '문단 번호')}${sm(I.indentR, '내어 쓰기')}</span></span>
</div>
<div class="hwp-fmtbar">
  <span class="hwp-combo hwp-w-style"><span class="hwp-combo-txt">바탕글</span>${I.caret}</span>
  <span class="hwp-fsep"></span>
  <span class="hwp-combo hwp-w-lang"><span class="hwp-combo-txt">대표</span>${I.caret}</span>
  <span class="hwp-combo hwp-w-font"><span class="hwp-combo-txt hwp-ff">함초롬바탕</span>${I.caret}</span>
  <span class="hwp-combo hwp-w-size">${fontSel}${I.caret}</span>
  <span class="hwp-spin"><span class="hwp-spin-b" data-hwp="fontup" title="글자 크게">${I.up}</span><span class="hwp-spin-b" data-hwp="fontdown" title="글자 작게">${I.down}</span></span>
  <span class="hwp-fsep"></span>
  <span class="hwp-fb hwp-b" title="진하게">가</span><span class="hwp-fb hwp-i" title="기울임">가</span><span class="hwp-fb hwp-u" title="밑줄">가</span><span class="hwp-fb hwp-s" title="취소선">가</span>
  <span class="hwp-fb hwp-color" title="글자 색">가<span class="hwp-color-bar"></span></span>${ib(I.highlight, '형광펜')}
  <span class="hwp-fsep"></span>
  <span class="hwp-ib on" title="양쪽 정렬">${I.aJustify}</span>${ib(I.aLeft, '왼쪽 정렬')}${ib(I.aCenter, '가운데 정렬')}${ib(I.aRight, '오른쪽 정렬')}
  <span class="hwp-fsep"></span>
  ${ib(I.lineSp, '줄 간격')}<span class="hwp-combo hwp-w-line">${lineSel}${I.caret}</span>
  <span class="hwp-spin"><span class="hwp-spin-b" data-hwp="lineup" title="줄 간격 넓게">${I.up}</span><span class="hwp-spin-b" data-hwp="linedown" title="줄 간격 좁게">${I.down}</span></span>
  <span class="hwp-fsep"></span>
  ${ib(I.indentL, '들여 쓰기')}${ib(I.indentR, '내어 쓰기')}
</div>
<div class="hwp-ruler"><div class="hwp-ruler-in" data-hwp="ruler">${rulerSVG()}</div></div>`;
  }

  let _ruler = '';
  function rulerSVG() {
    if (_ruler) return _ruler;
    const PX = 794 / 210; // 1mm
    let s = `<svg width="794" height="20" viewBox="0 0 794 20" aria-hidden="true">`;
    s += `<rect x="0" y="2" width="794" height="16" fill="#d4d4d4"/><rect x="${30 * PX}" y="2" width="${150 * PX}" height="16" fill="#fff"/>`;
    for (let mm = 1; mm < 210; mm++) {
      const x = (mm * PX).toFixed(2);
      const rel = mm - 30;
      if (rel % 10 === 0) {
        const n = Math.abs(rel / 10);
        if (n) s += `<text x="${x}" y="13.5" font-size="9" text-anchor="middle" fill="#444" font-family="Arial,sans-serif">${n}</text>`;
      } else if (rel % 5 === 0) s += `<path d="M${x} 13v5" stroke="#777"/>`;
      else s += `<path d="M${x} 15.5v2.5" stroke="#999"/>`;
    }
    // 여백 표시 (왼쪽/오른쪽 들여쓰기 삼각형)
    const L = 30 * PX, R = 180 * PX;
    s += `<path d="M${L - 4} 2h8l-4 5z M${L - 4} 18h8l-4-5z M${R - 4} 18h8l-4-5z" fill="#6a6a6a"/>`;
    s += `</svg>`;
    return (_ruler = s);
  }

  function bottomHTML(live) {
    return `
<div class="hwp-tabs">
  <span class="hwp-tab-nav">${I.left}${I.right}</span>
  <span class="hwp-tab-list" data-hwp="tabs">${live ? '' : `<span class="hwp-tab on">${I.doc}<span class="hwp-tab-name">${BOSS_FILE}</span></span><span class="hwp-tab">${I.doc}<span class="hwp-tab-name">회의록_11월.hwp</span></span>`}</span>
  <span class="hwp-tab-add" title="새 탭">${I.plus}</span>
</div>
<div class="hwp-status" data-hwp="status">
  <span class="hwp-st" data-hwp="st-page">1/1쪽</span><span class="hwp-st">1단</span>
  <span class="hwp-st" data-hwp="st-line">줄 1 칸 1</span>
  <span class="hwp-st" data-hwp="st-chars">0자</span>
  <span class="hwp-st" data-hwp="st-para">문단 0</span>
  <span class="hwp-st">삽입</span>
  <span class="hwp-st">변경 내용 [기록 중지]</span>
  <span class="hwp-st-fill"></span>
  <span class="hwp-st-views">${I.viewPage}${I.viewTwo}${I.viewWide}</span>
  <span class="hwp-zoom"><span class="hwp-zoom-txt" data-hwp="zoomtxt">100 %</span>
    <span class="hwp-zb" data-hwp="zoomout" title="축소">${I.minus}</span>
    ${live ? `<input type="range" min="50" max="200" step="10" value="${S.zoom}" data-hwp="zoom" title="쪽 확대 비율">` : `<span class="hwp-zoom-track"><span></span></span>`}
    <span class="hwp-zb" data-hwp="zoomin" title="확대">${I.plus}</span></span>
</div>`;
  }

  // ───────────────────────── 보스 화면 (가짜 공문서) ─────────────────────────
  const BOSS_FILE = '2026년 하반기 업무추진계획(안).hwp';
  function bossHTML() {
    const rows = [
      ['1', '부서별 상반기 실적 취합', '7월 2주', '기획팀'],
      ['2', '하반기 중점 과제 선정 회의', '7월 4주', '전 부서'],
      ['3', '예산 집행 현황 점검', '8월 3주', '재무팀'],
      ['4', '대민 서비스 만족도 조사', '9월 1주 ~ 9월 4주', '고객지원팀'],
      ['5', '정보보안 점검 및 교육', '10월 2주', '정보화팀'],
      ['6', '연말 성과 보고회 개최', '12월 2주', '기획팀'],
    ];
    return `<div class="hwp-boss-top">${topHTML(BOSS_FILE, false)}</div>
<div class="hwp-boss-area"><div class="hwp-boss-paper">
  <h1>2026년 하반기 주요 업무 추진 계획(안)</h1>
  <p class="hwp-boss-meta">작성: 기획팀 &nbsp;|&nbsp; 작성일: ${today()}</p>
  <h2>1. 추진 배경</h2>
  <p>상반기 추진 실적을 점검하고, 하반기 중점 과제를 체계적으로 관리하여 조직 목표를 차질 없이 달성하고자 함.</p>
  <h2>2. 추진 방향</h2>
  <p>○ 부서 간 협업 체계 강화 및 정기 점검 회의 운영<br>○ 예산 집행의 투명성 제고 및 불필요한 지출 절감<br>○ 대민 서비스 품질 개선을 위한 현장 의견 수렴</p>
  <h2>3. 세부 추진 일정</h2>
  <table><thead><tr><th>연번</th><th>추진 과제</th><th>일정</th><th>담당</th></tr></thead>
  <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>
  <p class="hwp-boss-cap">[표 1] 하반기 세부 추진 일정</p>
  <h2>4. 행정 사항</h2>
  <p>가. 각 부서는 과제별 추진 실적을 매월 말일까지 기획팀으로 제출<br>나. 추진 과정에서 발생하는 문제점은 즉시 보고하여 대책 마련<br>다. 기타 세부 사항은 별도 통보 예정.&nbsp; 끝.</p>
</div></div>
<div class="hwp-boss-bottom">${bottomHTML(false)}</div>`;
  }

  // ───────────────────────── 상태 ─────────────────────────
  let charName = '';
  let origTitle = '';
  let lastTabsSig = '';
  let bossOn = false;

  // ───────────────────────── 적용 ─────────────────────────
  function applyAll() {
    const talk = isTalk();
    if (!S.on) { teardown(); return; }
    root.setAttribute('data-hwp-theme', 'hangul');
    root.setAttribute('data-hwp-page', talk ? 'talk' : 'other');
    root.setAttribute('data-hwp-memo', S.memo);
    root.setAttribute('data-hwp-card', S.card);
    root.setAttribute('data-hwp-img', S.img);
    root.setAttribute('data-hwp-nav', S.nav);
    root.setAttribute('data-hwp-indent', S.indent ? '1' : '0');
    root.setAttribute('data-hwp-bold', S.bold ? '1' : '0');
    const st = root.style;
    st.setProperty('--hwp-fs', S.fontPt + 'pt');
    st.setProperty('--hwp-lh', String(S.lineH / 100));
    st.setProperty('--hwp-zoom', String(S.zoom / 100));
    st.setProperty('--hwp-date', cssStr('작성일: ' + today()));
    syncControls();
    ensure();
  }

  function teardown() {
    ['data-hwp-theme', 'data-hwp-page', 'data-hwp-memo', 'data-hwp-card', 'data-hwp-img', 'data-hwp-nav', 'data-hwp-indent', 'data-hwp-bold', 'data-hwp-boss']
      .forEach((a) => root.removeAttribute(a));
    ['--hwp-fs', '--hwp-lh', '--hwp-zoom', '--hwp-date', '--hwp-title', '--hwp-img', '--hwp-sbw'].forEach((p) => root.style.removeProperty(p));
    ['hwp-top', 'hwp-bottom', 'hwp-boss', 'hwp-favicon'].forEach((id) => { const e = document.getElementById(id); if (e) e.remove(); });
    restoreFavicon();
    if (origTitle && / - 한글$/.test(document.title)) document.title = origTitle;
    bossOn = false;
    lastTabsSig = '';
  }

  // 원래 파비콘은 rel을 바꿔 숨겨 두었다가 끄면 되돌린다
  function hideFavicon() {
    $$('link[rel~="icon"]:not(#hwp-favicon), link[rel="shortcut icon"]:not(#hwp-favicon), link[rel="apple-touch-icon"]').forEach((l) => {
      l.setAttribute('data-hwp-rel', l.getAttribute('rel'));
      l.setAttribute('rel', 'hwp-hidden-icon');
    });
    let f = document.getElementById('hwp-favicon');
    if (!f && document.head) {
      f = document.createElement('link');
      f.id = 'hwp-favicon'; f.rel = 'icon'; f.type = 'image/svg+xml'; f.href = FAVICON;
      document.head.appendChild(f);
    }
  }
  function restoreFavicon() {
    $$('link[data-hwp-rel]').forEach((l) => { l.setAttribute('rel', l.getAttribute('data-hwp-rel')); l.removeAttribute('data-hwp-rel'); });
  }

  function setTitle(t) {
    if (document.title === t) return;
    if (!/ - 한글$/.test(document.title)) origTitle = document.title;
    document.title = t;
  }

  function setText(el, t) { if (el && el.textContent !== t) el.textContent = t; }

  function readName() {
    const b = $(SEL.name);
    let n = b ? b.textContent.trim() : '';
    if (!n) {
      const id = talkId();
      const a = id && $(`nav.w-64 a[href*="${CSS.escape(id)}"]`);
      if (a) n = (a.getAttribute('aria-label') || '').trim();
    }
    return n;
  }

  function readImg() {
    const bg = $(SEL.bgImg);
    let src = bg && (bg.currentSrc || bg.src);
    if (!src) {
      const id = talkId();
      const im = id && $(`nav.w-64 a[href*="${CSS.escape(id)}"] img`);
      if (im) src = im.currentSrc || im.src || ((im.getAttribute('srcset') || '').split(/\s+/)[0]);
    }
    return src || '';
  }

  // ───────────────────────── 메인 보정 루프 ─────────────────────────
  function ensure() {
    if (!S.on) return;
    const talk = isTalk();
    if (root.getAttribute('data-hwp-page') !== (talk ? 'talk' : 'other')) root.setAttribute('data-hwp-page', talk ? 'talk' : 'other');
    if (!document.body) return;

    if (bossOn) mountBoss();

    if (!talk) {
      ['hwp-top', 'hwp-bottom'].forEach((id) => { const e = document.getElementById(id); if (e) e.remove(); });
      lastTabsSig = '';
      if (!bossOn) { restoreFavicon(); const f = document.getElementById('hwp-favicon'); if (f) f.remove(); if (origTitle && / - 한글$/.test(document.title)) document.title = origTitle; }
      return;
    }

    const n = readName();
    if (n) charName = n;
    const file = fileName(charName);

    let top = document.getElementById('hwp-top');
    if (!top) {
      top = document.createElement('div');
      top.id = 'hwp-top';
      top.innerHTML = topHTML(file, true);
      document.body.appendChild(top);
      bindTop(top);
    }
    let bottom = document.getElementById('hwp-bottom');
    if (!bottom) {
      bottom = document.createElement('div');
      bottom.id = 'hwp-bottom';
      bottom.innerHTML = bottomHTML(true);
      document.body.appendChild(bottom);
      bindBottom(bottom);
      lastTabsSig = '';
    }

    setText(top.querySelector('[data-hwp="title"]'), `${file} - 한글`);
    const t = cssStr(charName || '제목 없음');
    if (root.style.getPropertyValue('--hwp-title') !== t) root.style.setProperty('--hwp-title', t);
    const img = readImg();
    const iv = img ? `url(${cssStr(img)})` : 'none';
    if (root.style.getPropertyValue('--hwp-img') !== iv) root.style.setProperty('--hwp-img', iv);

    if (!bossOn) { setTitle(`${file} - 한글`); hideFavicon(); }
    buildTabs(bottom);
    measure();
    scheduleStatus();
  }

  // 스크롤바 폭 → 입력창 줄을 용지와 같은 중심에 맞춤, 눈금자 위치 맞춤
  function measure() {
    const sc = $(SEL.scroller);
    if (!sc) return;
    const sbw = Math.max(0, sc.offsetWidth - sc.clientWidth) + 'px';
    if (root.style.getPropertyValue('--hwp-sbw') !== sbw) root.style.setProperty('--hwp-sbw', sbw);
    const p = $(SEL.paper);
    const r = document.querySelector('#hwp-top [data-hwp="ruler"]');
    if (p && r) {
      const left = Math.round(p.getBoundingClientRect().left) + 'px';
      if (r.style.left !== left) r.style.left = left;
    }
  }

  // ───────────────────────── 리본/상태 표시줄 동작 ─────────────────────────
  function bindTop(top) {
    top.addEventListener('click', (e) => {
      const b = e.target.closest('[data-hwp]');
      if (!b) return;
      const k = b.getAttribute('data-hwp');
      if (k === 'fontup') setSetting({ fontPt: Math.min(FONT_MAX, Math.floor(S.fontPt) + 1) });
      else if (k === 'fontdown') setSetting({ fontPt: Math.max(FONT_MIN, Math.ceil(S.fontPt) - 1) });
      else if (k === 'lineup') setSetting({ lineH: Math.min(300, S.lineH + 10) });
      else if (k === 'linedown') setSetting({ lineH: Math.max(80, S.lineH - 10) });
    });
    top.addEventListener('change', (e) => {
      const k = e.target.getAttribute('data-hwp');
      if (k === 'fontsel') setSetting({ fontPt: Number(e.target.value) });
      else if (k === 'linesel') setSetting({ lineH: Number(e.target.value) });
    });
  }

  function bindBottom(bottom) {
    bottom.addEventListener('click', (e) => {
      const tab = e.target.closest('.hwp-tab[data-href]');
      if (tab) {
        const href = tab.getAttribute('data-href');
        const a = $$(SEL.recent).find((x) => x.getAttribute('href') === href);
        if (a) a.click(); else if (href) location.href = href;
        return;
      }
      const b = e.target.closest('[data-hwp]');
      if (!b) return;
      const k = b.getAttribute('data-hwp');
      if (k === 'zoomin') setSetting({ zoom: Math.min(200, S.zoom + 10) });
      else if (k === 'zoomout') setSetting({ zoom: Math.max(50, S.zoom - 10) });
    });
    bottom.addEventListener('change', (e) => {
      if (e.target.getAttribute('data-hwp') === 'zoom') setSetting({ zoom: Number(e.target.value) });
    });
  }

  // 리본·팝업·상태 표시줄 값이 서로 어긋나지 않게
  function syncControls() {
    const top = document.getElementById('hwp-top');
    if (top) {
      const fs = top.querySelector('[data-hwp="fontsel"]');
      if (fs && Number(fs.value) !== S.fontPt) {
        if (![...fs.options].some((o) => Number(o.value) === S.fontPt)) fs.add(new Option(fmtPt(S.fontPt), S.fontPt));
        fs.value = String(S.fontPt);
      }
      const ls = top.querySelector('[data-hwp="linesel"]');
      if (ls && Number(ls.value) !== S.lineH) {
        if (![...ls.options].some((o) => Number(o.value) === S.lineH)) ls.add(new Option(S.lineH + ' %', S.lineH));
        ls.value = String(S.lineH);
      }
    }
    const bottom = document.getElementById('hwp-bottom');
    if (bottom) {
      const z = bottom.querySelector('[data-hwp="zoom"]');
      if (z && Number(z.value) !== S.zoom) z.value = String(S.zoom);
      setText(bottom.querySelector('[data-hwp="zoomtxt"]'), S.zoom + ' %');
    }
  }

  // ───────────────────────── 아래 문서 탭 ─────────────────────────
  function buildTabs(bottom) {
    const list = bottom.querySelector('[data-hwp="tabs"]');
    if (!list) return;
    const id = talkId();
    const items = $$(SEL.recent).map((a) => ({
      href: a.getAttribute('href') || '',
      name: (a.getAttribute('aria-label') || a.textContent || '').trim(),
    })).filter((x) => x.href && x.name);
    if (id && !items.some((x) => x.href.includes(id))) items.unshift({ href: '', name: charName || '문서1', cur: true });
    const sig = id + '|' + S.fileFmt + '|' + items.map((x) => x.href + '=' + x.name).join(',');
    if (sig === lastTabsSig) return;
    lastTabsSig = sig;
    list.innerHTML = items.map((x) => {
      const on = x.cur || (id && x.href.includes(id));
      return `<span class="hwp-tab${on ? ' on' : ''}"${x.href ? ` data-href="${esc(x.href)}"` : ''} title="${esc(fileName(x.name))}">${I.doc}<span class="hwp-tab-name">${esc(fileName(x.name))}</span>${on ? `<span class="hwp-tab-x">${I.x}</span>` : ''}</span>`;
    }).join('');
    const on = list.querySelector('.hwp-tab.on');
    if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  // ───────────────────────── 상태 표시줄 계산 ─────────────────────────
  let stTimer = 0;
  function scheduleStatus() {
    if (stTimer) return;
    stTimer = setTimeout(() => { stTimer = 0; updatePages(); updateCaret(); }, 120);
  }

  function updatePages() {
    const bottom = document.getElementById('hwp-bottom');
    const sc = $(SEL.scroller), p = $(SEL.paper);
    if (!bottom || !sc || !p) return;
    const pr = p.getBoundingClientRect(), sr = sc.getBoundingClientRect();
    const ph = PAGE_H * (S.zoom / 100);
    const total = Math.max(1, Math.ceil((pr.height - 1) / ph));
    // 역방향 스크롤이라 scrollTop 대신 화면상 위치로 계산 (보이는 영역 위쪽 1/3 지점이 속한 쪽)
    const cur = clamp(Math.floor((sr.top - pr.top + sr.height / 3) / ph) + 1, 1, total);
    setText(bottom.querySelector('[data-hwp="st-page"]'), `${cur}/${total}쪽`);
    measure();
  }

  function updateCaret() {
    const bottom = document.getElementById('hwp-bottom');
    if (!bottom) return;
    const tb = $(SEL.textbox);
    let line = 1, col = 1;
    const sel = window.getSelection && window.getSelection();
    if (tb && sel && sel.rangeCount && tb.contains(sel.anchorNode)) {
      try {
        const r = document.createRange();
        r.selectNodeContents(tb);
        r.setEnd(sel.anchorNode, sel.anchorOffset);
        const lines = r.toString().split('\n');
        line = lines.length; col = lines[lines.length - 1].length + 1;
      } catch (e) {}
    }
    setText(bottom.querySelector('[data-hwp="st-line"]'), `줄 ${line} 칸 ${col}`);
  }

  // 글자 수·문단 수는 무거우니 디바운스
  let cntTimer = 0;
  function scheduleCount() {
    clearTimeout(cntTimer);
    cntTimer = setTimeout(updateCount, 700);
  }
  function updateCount() {
    const bottom = document.getElementById('hwp-bottom');
    const p = $(SEL.paper);
    if (!bottom || !p) return;
    let chars = 0, paras = 0;
    const ex = p.querySelectorAll('[data-chat-excerpt]');
    for (const el of ex) {
      if (el.parentElement && el.parentElement.closest('[data-chat-excerpt]')) continue;
      if (el.getAttribute('data-chat-excerpt') === 'text') {
        const t = el.textContent.replace(/\s+/g, ' ').trim();
        chars += t.length; if (t) paras += 1;
        continue;
      }
      // <br>로 나뉜 조각마다 한 문단
      let seg = '';
      for (const n of el.childNodes) {
        if (n.nodeName === 'BR') { if (seg.trim()) { paras++; } seg = ''; continue; }
        const t = n.textContent || '';
        chars += t.replace(/\n/g, '').length;
        seg += t;
      }
      if (seg.trim()) paras++;
    }
    setText(bottom.querySelector('[data-hwp="st-chars"]'), `${chars.toLocaleString('ko-KR')}자`);
    setText(bottom.querySelector('[data-hwp="st-para"]'), `문단 ${paras.toLocaleString('ko-KR')}`);
  }

  // ───────────────────────── 카드 접기/펼치기 (data-hwp-open) ─────────────────────────
  document.addEventListener('click', (e) => {
    if (root.getAttribute('data-hwp-page') !== 'talk' || root.getAttribute('data-hwp-card') !== 'collapse') return;
    const t = e.target;
    if (!(t instanceof Element)) return;
    const card = t.closest(SEL.cards);
    if (!card) return;
    if (!card.hasAttribute('data-hwp-open')) {
      card.setAttribute('data-hwp-open', '1');
      e.preventDefault(); e.stopPropagation();
    } else if (t === card) {
      // 펼친 상태에서는 캡션(::before) 줄을 눌렀을 때만 접기
      const r = card.getBoundingClientRect();
      if (e.clientY - r.top < 26) { card.removeAttribute('data-hwp-open'); e.preventDefault(); e.stopPropagation(); }
    }
  }, true);

  // ───────────────────────── 보스 키 (Alt+Q) ─────────────────────────
  function mountBoss() {
    if (document.getElementById('hwp-boss') || !document.body) return;
    const b = document.createElement('div');
    b.id = 'hwp-boss';
    b.innerHTML = bossHTML();
    document.body.appendChild(b);
  }
  function toggleBoss(force) {
    bossOn = typeof force === 'boolean' ? force : !bossOn;
    if (bossOn) {
      root.setAttribute('data-hwp-boss', '1');
      mountBoss();
      setTitle(`${BOSS_FILE} - 한글`);
      hideFavicon();
    } else {
      root.removeAttribute('data-hwp-boss');
      const b = document.getElementById('hwp-boss');
      if (b) b.remove();
      if (isTalk()) setTitle(`${fileName(charName)} - 한글`);
      else { restoreFavicon(); const f = document.getElementById('hwp-favicon'); if (f) f.remove(); if (origTitle) document.title = origTitle; }
    }
  }
  window.addEventListener('keydown', (e) => {
    if (!S.on || !S.boss) return;
    if (e.altKey && !e.ctrlKey && !e.metaKey && (e.code === 'KeyQ' || e.key === 'q' || e.key === 'Q')) {
      e.preventDefault(); e.stopPropagation();
      toggleBoss();
    }
  }, true);

  // ───────────────────────── 감시 (스로틀) ─────────────────────────
  let thr = 0;
  function throttledEnsure() {
    if (thr) return;
    thr = setTimeout(() => { thr = 0; ensure(); }, 250);
  }
  const isMine = (n) => n && n.nodeType === 1 && n.closest && n.closest('#hwp-top, #hwp-bottom, #hwp-boss');
  const mo = new MutationObserver((recs) => {
    if (!S.on) return;
    let mine = true, inPaper = false;
    for (const r of recs) {
      const t = r.target.nodeType === 1 ? r.target : r.target.parentElement;
      if (!isMine(t)) { mine = false; if (!inPaper && t && t.closest && t.closest('#chat-content-panel')) inPaper = true; }
    }
    if (mine) return;
    throttledEnsure();
    if (inPaper) scheduleCount();
  });
  mo.observe(root, { childList: true, subtree: true, characterData: true });

  document.addEventListener('scroll', () => { if (S.on && isTalk()) scheduleStatus(); }, true);
  document.addEventListener('selectionchange', () => { if (S.on && isTalk()) scheduleStatus(); });
  window.addEventListener('resize', () => { if (S.on) scheduleStatus(); });
  setInterval(() => { if (S.on) { ensure(); } }, 1000);
  setInterval(() => { if (S.on && isTalk()) updateCount(); }, 5000);

  applyAll();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { ensure(); updateCount(); });
  else updateCount();

  // 테스트 페이지에서 쓸 수 있게
  window.__hwpSkin = { get settings() { return S; }, set: setSetting, toggleBoss, updateCount, updatePages };
})();
