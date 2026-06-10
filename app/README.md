# Eco-Biz Connect — 모바일앱 (Expo / React Native)

Phase 4. 백엔드 API(UC1~UC13)와 연동한 모바일앱.

## 기술 스택
- Expo SDK 56 + React Native 0.85 + TypeScript
- JWT 인증(expo-secure-store), 역할 기반 화면, 파일 업로드(expo-document-picker)

## 화면
| 역할 | 화면 | 내용 |
| :--- | :--- | :--- |
| 공통 | Login | 로그인/회원가입(Merchant/Investor/Admin) |
| Merchant | Dashboard | 데이터 업로드·ESG·우대상품·대출(UC3~7) |
| Investor | Marketplace / Portfolio (하단 탭) | STO 구매(UC9·10)·포트폴리오·배당(UC11) |
| Admin | Console | 모니터링·STO 발행(UC8)·사용자 관리(UC13) |

## 실행
백엔드(`../backend`)가 떠 있어야 한다.

```bash
# Node 가 nvm 으로 설치된 경우
export PATH="$HOME/.nvm/versions/node/<버전>/bin:$PATH"

npm install        # 최초 1회
npx expo start     # QR 코드 / 시뮬레이터
```

### API 주소 (중요)
`src/lib/api.ts` 의 `API_BASE` 기본값은 `http://localhost:8000` 이다. 실행 환경에 따라
`EXPO_PUBLIC_API_BASE` 환경변수로 바꾼다.
- iOS 시뮬레이터: `http://localhost:8000`
- Android 에뮬레이터: `http://10.0.2.2:8000`
- 실기기: PC 의 LAN IP (예: `http://192.168.0.10:8000`)

## 검증
```bash
npx tsc --noEmit                       # 타입 체크
npx expo export --platform ios         # Metro 번들 확인
```

## 구조
```
App.tsx                 # AuthProvider + Root
src/
  Root.tsx              # 인증/역할 라우팅 + 투자자 하단 탭
  theme.ts              # 색상 토큰
  components/ui.tsx     # Card/StatCard/Section/Badge/Button
  lib/
    api.ts              # fetch 클라이언트(JWT, SecureStore)
    auth.tsx            # 인증 컨텍스트
    types.ts, format.ts
  screens/              # Login, Merchant, Marketplace, Portfolio, Admin
```
