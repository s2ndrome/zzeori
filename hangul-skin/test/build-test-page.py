"""저장된 케이브덕 채팅 페이지에서 노션 스킨 흔적과 스크립트를 걷어내고,
한글 스킨(theme.css + content.js)을 주입한 테스트 페이지를 만든다.

사용법: python3 -I build-test-page.py <저장된.html> <출력.html> <hangul-skin 폴더>
출력 파일은 저장된 HTML과 같은 폴더에 만들어야 _files 상대 경로가 맞는다.
"""
import sys, os, re
from bs4 import BeautifulSoup

src, out, skin = sys.argv[1], sys.argv[2], os.path.abspath(sys.argv[3])
s = BeautifulSoup(open(src, encoding='utf-8').read(), 'lxml')
html = s.html

# 1) 노션 스킨 흔적 제거
for k in list(html.attrs):
    if k.startswith('data-cvd'):
        del html[k]
if html.get('style'):
    del html['style']
for el in s.select('[id^=cvd-]'):
    el.decompose()
for el in s.find_all(attrs={'data-cvd-rel': True}):
    el['rel'] = el['data-cvd-rel']; del el['data-cvd-rel']
for el in s.find_all('link', rel='cvd-hidden-icon'):
    el['rel'] = 'icon'
for el in s.find_all(attrs=lambda a: a and any(k.startswith('data-cvd') for k in a)):
    for k in [k for k in el.attrs if k.startswith('data-cvd')]:
        del el[k]
for el in s.select('.cvd-active'):
    el['class'] = [c for c in el['class'] if c != 'cvd-active']
for t in s.find_all('title'):
    t.string = '신드롬 | 케이브덕'

# 2) 스크립트·추적용 요소 제거 (정적인 DOM만 남김)
for el in s.find_all(['script', 'iframe', 'noscript']):
    el.decompose()
for el in s.find_all('link', rel=lambda r: r and ('preload' in r or 'modulepreload' in r or 'prefetch' in r)):
    el.decompose()
for el in s.find_all('img', src=re.compile('adsct|facebook')):
    el.decompose()

# 3) 스킨 주입: chrome.storage 스텁 → theme.css → content.js
stub = s.new_tag('script')
stub.string = """
window.__HWP_TEST_PATH__ = '/ko/talk/321e4572-e9e5-4e19-9b94-aeb7fdb13bd6';
(function(){
  var store = {}; try { store = JSON.parse(localStorage.getItem('__hwp_stub') || '{}'); } catch(e) {}
  var ls = [];
  window.chrome = window.chrome || {};
  chrome.storage = { local: {
    get: function(k, cb){ var r = {}; [].concat(k).forEach(function(x){ if (x in store) r[x] = store[x]; }); setTimeout(function(){ cb(r); }, 0); },
    set: function(o, cb){ var ch = {}; for (var x in o) { ch[x] = { oldValue: store[x], newValue: o[x] }; store[x] = o[x]; }
      try { localStorage.setItem('__hwp_stub', JSON.stringify(store)); } catch(e) {}
      setTimeout(function(){ ls.forEach(function(f){ f(ch, 'local'); }); cb && cb(); }, 0); }
  }, onChanged: { addListener: function(f){ ls.push(f); } } };
})();
"""
head = s.head
head.insert(0, stub)
css = s.new_tag('link', rel='stylesheet', href='file://' + skin + '/theme.css')
head.insert(0, css)  # 콘텐츠 스크립트 CSS처럼 페이지 CSS보다 먼저
js = s.new_tag('script', src='file://' + skin + '/content.js')
head.insert(1, js)  # document_start 흉내: 본문보다 먼저 실행

open(out, 'w', encoding='utf-8').write(str(s))
print('ok', out)
