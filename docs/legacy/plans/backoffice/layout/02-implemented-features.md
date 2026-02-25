# Phase 01 이후 구현한 기능 정리

Phase 01 완료 후 추가로 반영한 백오피스·API 항목. 나중에 참고용.

**용어·파일 규칙**: 백오피스 레이아웃은 **AdminLayout** (`components/AdminLayout.jsx`) 단일 사용. 테마는 **AdminTheme.js** (`styles/AdminTheme.js`) 단일 사용. 본 문서의 `layout/`는 **계획 폴더** (docs/plans/backoffice/layout/)를 가리키며, 코드 경로가 아님.

---

## 1. 로그인 유지 (30일 세션)

- **목적**: "로그인 유지" 체크 시 최대 30일 세션, 미체크 시 브라우저 종료 시 로그아웃.
- **백엔드**
  - `apps/api/core/config.py`: `ACCESS_TOKEN_EXPIRE_DAYS_REMEMBER = 30` 추가.
  - `apps/api/routers/auth.py`: `LoginRequest.remember_me`, `create_access_token(..., remember_me)` 분기. `remember_me=True` → 30일, `False` → 24h.
- **프론트**
  - `LoginPage.jsx`: `rememberMe` 체크 시 `login({ ..., rememberMe })` 전달. 라벨 "로그인 유지 (최대 30일)".
  - `authProvider.js`: `remember_me` API 전달, `rememberMe`면 `localStorage`, 아니면 `sessionStorage`에 토큰/유저 저장. `getToken()`/`getUser()`/`clearAuth()`로 두 저장소 동시 처리.
  - `apiClient.js`: `getAccessToken()` (localStorage + sessionStorage), export.
  - `dataProvider.js`, `PostEditor.jsx`, `AdminLayout.jsx`: 토큰/유저 읽기·갱신 시 두 저장소 모두 고려.

---

## 2. 관리자 계정 초기화

- **목적**: 서버 기동 시 env에 정의된 관리자 계정이 없을 때만 생성. 있으면 건드리지 않음.
- **파일**: `apps/api/core/db_init.py`의 `_ensure_admin()`
- **내용**: `SELECT ... WHERE email = SEED_ADMIN_EMAIL` → 없으면 INSERT만, 있으면 아무것도 하지 않음. (카테고리·about_messages 등 별도 시드는 제거됨)

---

## 3. 브랜딩·메뉴 라벨

- **JUNGEUI LAB ADMIN → JUNGEUI LAB**: "ADMIN" 제거. `AdminLayout.jsx`, `getPageTitle` 기본값.
- **글 → 포스트**: 메뉴/페이지 라벨 통일. "글", "글 목록", "새 글 쓰기" → "포스트", "포스트 목록", "새 포스트". (AdminLayout, PostList, PostEditor, Dashboard)

---

## 4. 사이드바 호버

- **목적**: 메뉴 호버 시 파란 배경 없이 커서만 pointer.
- **파일**: `AdminLayout.jsx`
- **내용**: 단일 메뉴·아코디언 헤더·chevron·하위 메뉴에서 `hover:bg-sky-500`, `hover:text-white`, `group-hover:text-white` 제거. `cursor-pointer`만 유지. active 구간은 기존처럼 `bg-sky-500` 유지.

---

## 5. 백오피스 반응형 (bridgenote-main 참고)

- **참고**: `(sample)/(sample)bridgenote-main/backoffice/templates/base.html` 및 `docs/guides/backoffice/` (구현 가이드).
- **Tailwind**: `tailwind.config.js`에 `screens: { tablet: '1024px', desktop: '1280px' }` 추가.
- **CSS**: `index.css`에 1279px 이하 사이드바 `sidebar-overlay-mode`(fixed, translateX -100%), `sidebar-overlay-open` 시 슬라이드 인. 1280px 이상 `position: relative`. `.collapsed` 시 로고 숨기고 토글만 중앙.
- **AdminLayout**
  - `useWindowWidth()`, `isMobile`(<1024), `isTablet`(1024~1279), `isDesktop`(≥1280).
  - 상태: `sidebarCollapsed`, `mobileOverlayOpen`.
  - &lt;1024: 사이드바 기본 숨김, 햄버거 → 오버레이 + 사이드바 표시. 메뉴/로고 클릭 시 오버레이 닫기.
  - 1024~1279: 기본 4rem 아이콘만. 햄버거 → 오버레이 + 15rem 사이드바. 1280+ 리사이즈 시 오버레이 자동 닫기.
  - ≥1280: 사이드바 15rem/4rem 토글, localStorage에 `sidebarCollapsed` 저장.
  - 메인 패딩: `px-4 tablet:px-6 desktop:px-8 py-6`.
- **접힌 상태에서 아코디언 제거**: `(isDesktop && sidebarCollapsed) || (isTablet && !mobileOverlayOpen)`일 때 포스트 섹션은 아코디언 대신 `/posts`로 가는 단일 링크(아이콘만)로 렌더.

---

## 6. 대시보드 통계·발행 포스트

- **UI 변경**: 두 번째 카드 "발행 포스트"(PUBLISHED + UNLISTED). 아이콘 Lucide `FileText`, 값은 `stats.published_posts`.
- **API 추가**: `GET /api/dashboard/stats`, `GET /api/dashboard/recent-activity`
  - **파일**: `apps/api/routers/dashboard.py`, `routers/__init__.py`에 등록.
  - **응답**: `today_visits`, `total_views`, `published_posts`. recent-activity: 최근 글 5건 (id, title, slug, status, updated_at). 둘 다 **인증 필수**.
  - **방문자/조회수**: `daily_stats` 테이블에서 `date` 기준 오늘 `visitor_count`, 누적 조회수는 **오늘 포함** `SUM(total_views)` (클라이언트 글 상세 조회 시 즉시 반영).
  - **발행 포스트**: `posts` 테이블에서 `status IN ('PUBLISHED', 'UNLISTED')` COUNT.
- **방문자 데이터**: **구현됨**. `posts` get_post에서 비로그인+PUBLISHED 조회 시 `daily_stats` 자동 갱신. 타임존은 `config.get_today_iso()` (TIMEZONE_OFFSET_HOURS).
- **바로가기**: 포스트 목록, 경력 관리, **프로젝트 관리** 3개.
- **최근 활동**: 클릭 시 **상세** (`/posts/:id`)로 이동.
- **알림**: `/notifications` 페이지, AdminLayout 헤더 유저 메뉴 왼쪽 종 아이콘. 알림함은 `GET /api/dashboard/recent-activity` 기반 최근 수정 글 목록.

---

## 7. 누적 조회수·알림함·다크모드 (04-view-count-notifications-darkmode)

- **누적 조회수**: `GET /api/dashboard/stats`의 `total_views`를 **오늘 포함** (`WHERE date <= :dt`)으로 변경. 클라이언트 글 상세 조회 시 1회 반영되는 기존 동작 유지.
- **알림함**: AdminLayout 헤더에 종 아이콘, `getPageTitle`에 `/notifications` → "알림". NotificationsPage에서 recent-activity API 연동, 리스트 UI(제목·slug·status·수정일), 클릭 시 `/posts/:id`. App.jsx에 `/notifications` 라우트.
- **다크모드**: Tailwind `darkMode: 'class'`. main.jsx에서 초기 `backoffice-theme` 복원. AdminLayout에 다크 토글(해/달) 아이콘(알림 오른쪽), `isDark` 상태 및 `document.documentElement` class·localStorage 저장. 레이아웃·대시보드·알림함 페이지에 `dark:` 스타일 적용.

---

## 관련 파일 요약

| 구분 | 파일 |
|------|------|
| 로그인 유지 | `api/core/config.py`, `api/routers/auth.py`, `LoginPage.jsx`, `authProvider.js`, `apiClient.js`, `dataProvider.js`, `PostEditor.jsx`, `AdminLayout.jsx` |
| 시드 | `apps/api/core/db_init.py` (_ensure_admin) |
| 브랜딩·메뉴 | `AdminLayout.jsx`, `PostList.jsx`, `PostEditor.jsx`, `Dashboard.jsx` |
| 사이드바 호버 | `AdminLayout.jsx` |
| 반응형 | `tailwind.config.js`, `index.css`, `AdminLayout.jsx` |
| 대시보드 통계 | `api/routers/dashboard.py`, `api/routers/__init__.py`, `pages/dashboard/Dashboard.jsx` |
| 알림 | `pages/notifications/NotificationsPage.jsx`, `App.jsx` (/notifications), `AdminLayout.jsx` (종 아이콘, getPageTitle) |
| 누적 조회수·알림함·다크모드 | `api/routers/dashboard.py`, `AdminLayout.jsx`, `main.jsx`, `tailwind.config.js`, `Dashboard.jsx`, `NotificationsPage.jsx` |
| Primary 템플릿·다크모드 완성 | `client/index.css`, `PostList.jsx`, `PostDetail.jsx`, `CareerList.jsx`, `ProjectList.jsx` (05-primary-templating-darkmode-completion) |

---

## 8. Primary 색상 템플릿화·백오피스 다크모드 완성 (05-primary-templating-darkmode-completion)

- **클라이언트 Primary**: `#35C5F0`/`#2BB8E3`를 **단일 소스**로. `apps/client/src/index.css`의 `@theme`에만 hex 정의, `:root`/`.dark`의 `--ui-primary`는 `var(--color-primary)` 참조.
- **백오피스 다크모드 완성**: PostList, PostDetail, CareerList, ProjectList 전역에 Tailwind `dark:` 적용(필터 카드, 테이블, 헤더, 버튼, 페이지네이션, 에러 박스 등). 액센트를 초록색(green-600 등)으로 통일(새 포스트/검색/보기/수정 버튼·링크).

---

## 제거된 코드 (미사용)

- **레이아웃**: 백오피스는 **AdminLayout** (`components/AdminLayout.jsx`) 단일 사용. 미참조된 **apps/backoffice/src/layout/** 폴더 삭제 (AppLayout, AppAppBar, AppSidebar, AppMenu).
- **테마**: 위 src/layout 전용이었던 **theme.js** 삭제. 백오피스 테마는 **styles/AdminTheme.js** 단일 사용.
