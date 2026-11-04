# R♡M 운영 메모

## 구조
- `s2ndrome/zzeori` (이 저장소): 화면 코드만 있어요. GitHub Pages로 yujin.64bit.kr 에 올라가요.
- `s2ndrome/zzeori-data` (비공개): 실제 프롬프트(`data/state.json`)와 의상 이미지(`images/`)가 들어 있어요.
- 사이트에 들어갈 때 GitHub 토큰을 넣으면, 그 토큰으로 비공개 저장소를 읽고 써요. 토큰이 없으면 아무 내용도 볼 수 없어요.

## GitHub Pages 켜기 (처음 한 번)
1. `s2ndrome/zzeori` → **Settings** → 왼쪽 **Pages**
2. Build and deployment → Source: **Deploy from a branch**
3. Branch: **main** / **(root)** → **Save**
4. 같은 화면 **Custom domain**에 `yujin.64bit.kr` → **Save** (DNS 확인이 끝나면 **Enforce HTTPS** 체크)
5. 64bit.kr DNS: `yujin` CNAME → `s2ndrome.github.io` (이미 되어 있어요)

## 토큰 발급
GitHub 프로필 → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
- Repository access: **Only select repositories** → `zzeori-data`
- Permissions → Contents: **Read and write** (보기만 할 사람은 **Read-only**)

토큰을 끊으려면 같은 화면에서 그 토큰을 삭제하면 돼요. 그 토큰으로 들어와 있던 사람은 다음 저장이나 새로고침 때 입장 화면으로 돌아가요.
