# Phase 01: 백오피스 정리·API 연동·대시보드

## 목표

- 은혜이음교회 레거시 제거.
- API 베이스·인증 연동 확정.
- 대시보드 화면에 통계·바로가기 연동.

참조: [../common/01-db-schema.md](../common/01-db-schema.md), [../common/02-api-spec.md](../common/02-api-spec.md)

---

## 1. 레거시 제거 (AdminLayout)

**파일**: `apps/backoffice/src/components/AdminLayout.jsx`

- **navSections**: 회원 관리, 콘텐츠 관리, 교회소개, 교적, 설정, 가족모임 관리 전부 제거. Jungeui 5개만 유지: 대시보드(/), 글(아코디언·글 목록 /posts), 글 쓰기(/posts/new), 경력(/careers), 프로젝트(/projects).
- **아코디언 state**: `contentAccordionOpen`, `usersAccordionOpen`, `churchAccordionOpen`, `membershipAccordionOpen`, `settingsAccordionOpen` 및 관련 `useEffect` 제거.
- **getPageTitle**: 레거시 경로 매핑 제거. `/`, `/posts`, `/write`, `/careers`, `/projects`, `/assets` 만 매핑.
- **loadUserInfo**: `/api/auth/me` 호출 시 응답 필드가 Jungeui API 스펙(name 등)에 맞게 처리. nickname → name 등.
- 기타 레거시 경로 참조(특수 케이스 매핑 등) 전부 제거.

## 2. API·인증 연동

- **authProvider**: 이미 POST /api/auth/login, JWT 저장. 02-api-spec과 일치하는지 확인.
- **dataProvider**: `apiUrl` = `VITE_API_URL` + `/api`. getList/getOne/create/update/delete 시 리소스명을 API 경로와 맞춤 (posts, categories, tags, careers, projects, assets). 02-api-spec 엔드포인트와 동일한 prefix 사용.
- **apiClient**: 루트 .env의 `VITE_API_URL` 사용 (이미 반영된 경우 유지).

## 3. 대시보드

**파일**: `apps/backoffice/src/pages/Dashboard.jsx`

- **통계**: GET /api/dashboard/stats (또는 동일 스펙) 연동. 오늘/어제 방문자, 누적 조회수 등 표시. API 미구현 시 플레이스홀더 유지.
- **Quick Action**: [새 글 쓰기] → `/posts/new`, [경력 추가] → `/careers`.
- **Recent Activity**: 최근 글 5개, 최근 댓글(Utterances 연동 시) 영역. API 준비되면 연동.

## 4. Phase 01-2 추가 기능

### 4.1 로그인 유지 (30일 세션)

- **목적**: "로그인 유지" 체크 시 최대 30일 세션, 미체크 시 브라우저 종료 시 로그아웃.
- **백엔드**: `apps/api/core/config.py` — `ACCESS_TOKEN_EXPIRE_DAYS_REMEMBER = 30`. `apps/api/routers/auth.py` — `LoginRequest.remember_me`, `create_access_token(..., remember_me)` 분기.
- **프론트**: `LoginPage.jsx` — `rememberMe` 체크 시 `login({ ..., rememberMe })` 전달. `authProvider.js` — `remember_me` API 전달, `rememberMe`면 `localStorage`, 아니면 `sessionStorage`. `apiClient.js` — `getAccessToken()` (localStorage + sessionStorage).

### 4.2 시드 관리자 비밀번호 갱신

- **파일**: `scripts/seed_data.py`. 관리자 계정이 이미 있으면 INSERT 대신 `UPDATE users SET password_hash = %s, name = %s WHERE email = %s` 실행.

### 4.3 브랜딩·메뉴 라벨

- **JUNGEUI LAB ADMIN → JUNGEUI LAB**: "ADMIN" 제거.
- **글 → 포스트**: 메뉴/페이지 라벨 통일 ("포스트", "포스트 목록", "새 포스트").

### 4.4 사이드바 호버

- 메뉴 호버 시 파란 배경 없이 `cursor-pointer`만 유지. active 구간은 기존처럼 `bg-sky-500` 유지.

### 4.5 백오피스 반응형

- **Tailwind**: `screens: { tablet: '1024px', desktop: '1280px' }`.
- **CSS**: 1279px 이하 사이드바 오버레이 모드, 1280px 이상 `position: relative`. `.collapsed` 시 로고 숨기고 토글만.
- **AdminLayout**: `useWindowWidth()`, `isMobile`(<1024), `isTablet`(1024~1279), `isDesktop`(≥1280). 상태: `sidebarCollapsed`, `mobileOverlayOpen`. 접힌 상태에서 포스트 섹션은 아코디언 대신 `/posts` 단일 링크.

### 4.6 대시보드 통계·발행 포스트

- **API**: GET /api/dashboard/stats — `today_visits`, `yesterday_visits`, `total_views`, `published_posts`.
- **UI**: 두 번째 카드 "발행 포스트"(PUBLISHED + UNLISTED).

## 완료 기준

- AdminLayout에 은혜이음 전용 메뉴·경로·getPageTitle 없음.
- 대시보드에서 통계 API 호출(또는 준비 후 연동 가능한 구조).
- 로그인·dataProvider가 02-api-spec 기준으로 동작.

---

## Phase 01 완료

위 완료 기준 충족. AdminLayout Jungeui 6개 메뉴만 유지, getPageTitle 레거시 제거, loadUserInfo Jungeui 스펙(name 등), apiClient/dataProvider/authProvider VITE_API_URL·02-api-spec 연동, 대시보드 GET /api/dashboard/stats·바로가기(/posts/new, /careers)·Recent Activity 플레이스홀더 반영됨.
