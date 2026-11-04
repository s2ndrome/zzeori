# yujin.64bit.kr 올리기 (Cloudflare Pages)

이 사이트는 Cloudflare Pages에서 돌아가요. 서버(`functions/_middleware.js`)가 토큰을 확인하고,
맞는 토큰을 넣은 사람에게만 페이지·이미지·데이터를 보내요. 토큰은 저장소에 두지 않고 Cloudflare 설정에만 넣어요.

## 1. 저장소를 비공개로 바꾸기 (꼭 해 주세요)
GitHub → `s2ndrome/zzeori` → Settings → 맨 아래 **Danger Zone** → **Change visibility** → Private.
공개 저장소면 사이트를 잠가도 깃허브에서 코드와 기본 프롬프트가 보여요. Cloudflare Pages는 비공개 저장소도 무료로 연결돼요.

## 2. Cloudflare Pages 프로젝트 만들기
1. https://dash.cloudflare.com 가입 / 로그인
2. **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → `s2ndrome/zzeori` 선택
3. 설정
   - Production branch: `main`
   - Framework preset: `None`
   - Build command: 비워 두기
   - Build output directory: `/` (또는 비워 두기)
4. **Save and Deploy** → `프로젝트이름.pages.dev` 주소가 생겨요.

## 3. 저장소(KV) 연결 — 추가한 프롬프트·이미지를 모두가 같이 보게
1. **Workers & Pages** → **KV** → **Create namespace** → 이름 `zzeori-data`
2. Pages 프로젝트 → **Settings** → **Bindings** → **Add** → **KV namespace**
   - Variable name: `DB`
   - KV namespace: `zzeori-data`

## 4. 토큰 넣기
Pages 프로젝트 → **Settings** → **Variables and Secrets** → **Add**
- Type: **Secret**
- Variable name: `TOKENS`
- Value: 토큰들을 쉼표로 구분해서. 예) `토큰1, 토큰2`

토큰은 길고 무작위인 문자열로 만들어 주세요. 토큰 하나를 지우면, 그 토큰으로 들어온 사람은 바로 입장 화면으로 돌아가요.
설정을 바꾼 뒤에는 **Deployments** → 최신 배포 → **Retry deployment** 를 한 번 눌러 주세요.

## 5. yujin.64bit.kr 연결
1. Pages 프로젝트 → **Custom domains** → **Set up a custom domain** → `yujin.64bit.kr`
2. 64bit.kr DNS 관리 화면에서 `yujin.64bit.kr` 레코드를 **수정**
   - 레코드 타입: `CNAME`
   - 내용: `s2ndrome.github.io` → `프로젝트이름.pages.dev` 로 변경
3. 몇 분 뒤 Cloudflare 화면에 Active 가 뜨면 끝.

## 확인
- 시크릿 창에서 yujin.64bit.kr 접속 → 토큰 화면이 나와야 정상
- 토큰 입력 → 사이트가 열리고, 오른쪽 위 숫자 밑에 `shared` 가 보이면 공유 저장소가 연결된 상태
  (`this browser only` 가 보이면 3번 KV 연결을 다시 확인해 주세요)
