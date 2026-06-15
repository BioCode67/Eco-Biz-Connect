# Implementation 과제 제출 가이드 — Eco-Biz Connect

> 22311898 김주형 · 영남대학교
> 본 프로젝트는 **웹 + 앱(React Native)** 을 모두 구현 → 과제 규정상 **웹 링크 + APK 모두 제출**.

---

## 1. 제출 창 본문에 붙여넣을 내용

```
학번: 22311898
이름: 김주형

GitHub Repository:
https://github.com/BioCode67/Eco-Biz-Connect

웹 서비스 접속 주소 (교수님 평가용):
https://<배포후-Vercel주소>.vercel.app

데모 계정 (역할별 체험):
  소상공인  merchant@ebc.com / Merch123!
  투자자    investor@ebc.com / Invest123!
  관리자    admin@ebc.com    / Admin123!

※ 백엔드 서버는 6월 25일까지 열어 둡니다.
```

> 배포 후 발급되는 실제 Vercel 주소로 `<배포후-Vercel주소>` 부분을 교체하세요.

---

## 2. 첨부 파일 체크리스트

| 항목 | 파일/링크 | 상태 |
|------|-----------|------|
| 소스 코드 (압축) | `Eco-Biz-Connect_22311898_김주형_source.zip` (아래 3번 참고) | ✅ 생성 가능 |
| 웹 배포 링크 | `https://...vercel.app` (제출 창 텍스트로 입력) | ⏳ **본인 배포 필요** |
| APK (안드로이드) | `eco-biz-connect.apk` (아래 5번 EAS 빌드) | ⏳ **본인 빌드 필요** |

---

## 3. 소스 코드 압축 (실행 1줄)

GitHub에 작업한 소스를 그대로 압축한 파일을 만든다(빌드 산출물·node_modules 제외, 깔끔한 추적 소스만):

```bash
cd /Users/it/Desktop/Eco-Biz-Connect
git archive --format=zip -o ~/Desktop/Eco-Biz-Connect_22311898_김주형_source.zip HEAD
```

→ 바탕화면에 `Eco-Biz-Connect_22311898_김주형_source.zip` 생성. 이 파일을 첨부.
(또는 GitHub 저장소 → Code → Download ZIP 으로 받아도 동일)

---

## 4. 웹 배포 (백엔드 Render + 웹 Vercel) — 6/25까지 유지

상세 클릭 가이드는 **[`DEPLOYMENT.md`](./DEPLOYMENT.md)** 참고. 요약:

### 4-1. 백엔드 (Render, 무료)
1. https://render.com 로그인 → **New → Blueprint** → 이 GitHub 저장소 연결
2. `render.yaml` 자동 인식 → 생성. 시작 시 마이그레이션→데모데이터 시드까지 자동.
3. 발급 URL 확인(보통 `https://ebc-backend.onrender.com`). `/health` 가 `{"status":"ok"}` 면 성공.

### 4-2. 웹 (Vercel, 무료)
1. https://vercel.com 로그인 → **Add New → Project** → 같은 저장소 → **Root Directory = `web`**
2. 환경변수 2개 설정:
   - `NEXT_PUBLIC_API_BASE` = 위 Render 백엔드 URL (끝 슬래시 없이)
   - `NEXT_PUBLIC_SITE_URL` = 배포될 Vercel 주소 (예 `https://eco-biz-connect.vercel.app`)
3. **Deploy** → 1~2분 후 `https://<프로젝트>.vercel.app` 발급 → 이 주소를 제출 본문에 입력.

> ⚠️ 무료 Render는 비활성 시 슬립 → 첫 접속이 느릴 수 있음. 평가 직전 한 번 미리 접속해 깨워두면 좋음.

---

## 5. APK 빌드 (EAS Build · 클라우드, 로컬 안드로이드 SDK 불필요)

> 이 PC엔 Android SDK/JDK가 없어 로컬 빌드는 불가 → Expo 클라우드 빌드(EAS)로 APK 생성.
> `app/eas.json`의 `preview` 프로필이 **설치 가능한 .apk** 를 만들도록 설정되어 있음.

**순서 (백엔드 배포가 먼저 끝나야 함 — APK가 그 주소로 통신):**

1. `app/eas.json` 의 `EXPO_PUBLIC_API_BASE` 값이 4-1에서 발급된 **실제 Render 백엔드 URL** 과 같은지 확인(다르면 그 값으로 수정).
2. 터미널에서:
   ```bash
   cd /Users/it/Desktop/Eco-Biz-Connect/app
   npx eas login            # Expo 계정 로그인(없으면 expo.dev 에서 무료 가입)
   npx eas build -p android --profile preview
   ```
3. 약 10~15분 후 빌드 완료 → 터미널/Expo 대시보드에 **APK 다운로드 링크** 표시 → 받아서 `eco-biz-connect.apk` 로 첨부.
4. (확인) 안드로이드 폰에서 설치 → 데모 계정으로 로그인되면 정상.

> 계정 로그인·가입은 본인이 직접 수행해야 합니다(보안상 자동화 불가).

---

## 6. 최종 제출 전 점검

- [ ] 소스 zip 첨부 (3번)
- [ ] 웹 링크 제출 본문에 입력 + 브라우저에서 한 번 접속 확인 (4번)
- [ ] APK 첨부 + 실제 폰 설치 확인 (5번)
- [ ] 백엔드 `/health` 200 확인, 6/25까지 슬립되어도 접속 시 자동 기동됨
- [ ] 제출 본문에 학번·이름·GitHub 주소 기재
