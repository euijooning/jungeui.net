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
- **getPageTitle**: 레거시 경로 매핑 제거. `/`, `/posts`, `/posts/new`, `/posts/:postId/edit`, `/posts/:postId`, `/posts/categories`, `/messages`, `/careers`, `/projects`, `/notifications` 등 Jungeui 라우트만 매핑. (파일 보관함 `/assets` 메뉴는 없음.)
- **loadUserInfo**: `/api/auth/me` 호출 시 응답 필드가 Jungeui API 스펙(name 등)에 맞게 처리. nickname → name 등.
- 기타 레거시 경로 참조(특수 케이스 매핑 등) 전부 제거.

## 2. API·인증 연동

- **authProvider**: POST /api/auth/login, JWT 저장. 02-api-spec과 일치. `API_BASE`는 **apiConfig**에서만 import (apiClient와 순환 의존성 회피).
- **dataProvider**: `API_BASE`를 apiClient에서 import. `apiUrl` = `API_BASE` + `/api`. getList/getOne/create/update/delete 시 리소스명을 API 경로와 맞춤 (posts, categories, tags, careers, projects, assets). 02-api-spec 엔드포인트와 동일한 prefix 사용.
- **apiClient** · **apiConfig**: 루트 .env의 `VITE_API_URL`을 **단일 소스**로 사용. `lib/apiConfig.js`에 `API_BASE`, `isDev`, `UPLOAD_URL` 정의, `lib/apiClient.js`가 사용·재export. 페이지·authProvider·dataProvider는 apiClient(또는 authProvider만 apiConfig)에서 import. 상세는 [../common/09-security-and-shared-config.md](../common/09-security-and-shared-config.md) 참고.

## 3. 대시보드

**파일**: `apps/backoffice/src/pages/Dashboard.jsx`

- **통계**: GET /api/dashboard/stats — `today_visits`, `total_views`, `published_posts`. 인증 필수. daily_stats는 퍼블릭 post 조회 시 자동 갱신.
- **바로가기**: 포스트 목록, 경력 관리, 프로젝트 관리.
- **최근 활동**: GET /api/dashboard/recent-activity. 클릭 시 상세(`/posts/:id`)로 이동.

## 4. Phase 01-2 추가 기능

### 4.1 로그인 유지 (30일 세션)

- **목적**: "로그인 유지" 체크 시 최대 30일 세션, 미체크 시 브라우저 종료 시 로그아웃.
- **백엔드**: `apps/api/core/config.py` — `ACCESS_TOKEN_EXPIRE_DAYS_REMEMBER = 30`. `apps/api/routers/auth.py` — `LoginRequest.remember_me`, `create_access_token(..., remember_me)` 분기.
- **프론트**: `LoginPage.jsx` — `rememberMe` 체크 시 `login({ ..., rememberMe })` 전달. `authProvider.js` — `remember_me` API 전달, `rememberMe`면 `localStorage`, 아니면 `sessionStorage`. `apiClient.js` — `getAccessToken()` (localStorage + sessionStorage).

### 4.2 관리자 계정 초기화

- **파일**: `apps/api/core/db_init.py`의 `_ensure_admin()`. 서버 기동 시 env(SEED_ADMIN_EMAIL 등)로 관리자 조회 → 없을 때만 INSERT. 있으면 아무것도 하지 않음.

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

- **API**: GET /api/dashboard/stats — `today_visits`, `total_views`, `published_posts`. GET /api/dashboard/recent-activity — 최근 글 5건. 둘 다 인증 필수.
- **UI**: 두 번째 카드 "발행 포스트"(PUBLISHED + UNLISTED).

### 4.7 알림

- **AdminLayout**: 헤더 유저 메뉴 왼쪽 종 아이콘 → `/notifications`.

## 완료 기준

- AdminLayout에 은혜이음 전용 메뉴·경로·getPageTitle 없음.
- 대시보드에서 통계 API 호출(또는 준비 후 연동 가능한 구조).
- 로그인·dataProvider가 02-api-spec 기준으로 동작.

---

## Phase 01 완료

위 완료 기준 충족. AdminLayout Jungeui 6개 메뉴만 유지, getPageTitle 레거시 제거, loadUserInfo Jungeui 스펙(name 등), apiClient/dataProvider/authProvider VITE_API_URL·02-api-spec 연동, 대시보드 GET /api/dashboard/stats·바로가기(포스트 목록·경력·프로젝트)·Recent Activity(클릭 시 상세)·알림(/notifications) 반영됨.
