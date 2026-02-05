# Phase 01-2: Phase 01 이후 구현한 기능 정리

Phase 01 완료 후 추가로 반영한 백오피스·API 항목. 나중에 참고용.

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

## 2. 시드 관리자 비밀번호 갱신

- **목적**: `.env`의 `SEED_ADMIN_PASSWORD` 변경 후 재실행만으로 DB 비밀번호 반영.
- **파일**: `scripts/seed_data.py`
- **내용**: 관리자 계정이 이미 있으면 INSERT 대신 `UPDATE users SET password_hash = %s, name = %s WHERE email = %s` 실행. `python scripts/seed_data.py` 재실행 시 현재 .env 비밀번호/이름으로 갱신.

---

## 3. 브랜딩·메뉴 라벨

- **JUNGEUI LAB ADMIN → JUNGEUI LAB**: "ADMIN" 제거. `AdminLayout.jsx`, `AppAppBar.jsx`, `AppSidebar.jsx`, `getPageTitle` 기본값.
- **글 → 포스트**: 메뉴/페이지 라벨 통일. "글", "글 목록", "새 글 쓰기" → "포스트", "포스트 목록", "새 포스트". (AdminLayout, AppMenu, AppAppBar, PostList, PostEditor, Dashboard)

---

## 4. 사이드바 호버

- **목적**: 메뉴 호버 시 파란 배경 없이 커서만 pointer.
- **파일**: `AdminLayout.jsx`
- **내용**: 단일 메뉴·아코디언 헤더·chevron·하위 메뉴에서 `hover:bg-sky-500`, `hover:text-white`, `group-hover:text-white` 제거. `cursor-pointer`만 유지. active 구간은 기존처럼 `bg-sky-500` 유지.

---

## 5. 백오피스 반응형 (bridgenote-main 참고)

- **참고**: `(sample)/(sample)bridgenote-main/backoffice/templates/base.html` 및 `docs/guides/backoffice-layout-renewal.md`, `responsive-improvements.md`.
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

- **UI 변경**: 두 번째 카드 "어제 방문자" → "발행 포스트". 부제 "전일 기준" → "PUBLISHED + UNLISTED". 아이콘 `fa-file-alt`, 값은 `stats.published_posts`.
- **API 추가**: `GET /api/dashboard/stats`
  - **파일**: `apps/api/routers/dashboard.py` (신규), `routers/__init__.py`에 등록.
  - **응답**: `today_visits`, `yesterday_visits`, `total_views`, `published_posts`.
  - **방문자/조회수**: `daily_stats` 테이블에서 `date` 기준 오늘/어제 `visitor_count`, 전일 `SUM(total_views)`.
  - **발행 포스트**: `posts` 테이블에서 `status IN ('PUBLISHED', 'UNLISTED')` COUNT.
- **방문자 데이터**: 클라이언트는 `/api/dashboard/stats` 한 번만 호출. 실제 방문자 수는 백엔드가 `daily_stats`를 조회해 채움. 클라이언트/퍼블릭에서 조회 시 `daily_stats`에 기록하는 로직을 넣으면 숫자가 쌓임.

---

## 관련 파일 요약

| 구분 | 파일 |
|------|------|
| 로그인 유지 | `api/core/config.py`, `api/routers/auth.py`, `LoginPage.jsx`, `authProvider.js`, `apiClient.js`, `dataProvider.js`, `PostEditor.jsx`, `AdminLayout.jsx` |
| 시드 | `scripts/seed_data.py` |
| 브랜딩·메뉴 | `AdminLayout.jsx`, `AppMenu.jsx`, `AppAppBar.jsx`, `AppSidebar.jsx`, `PostList.jsx`, `PostEditor.jsx`, `Dashboard.jsx` |
| 사이드바 호버 | `AdminLayout.jsx` |
| 반응형 | `tailwind.config.js`, `index.css`, `AdminLayout.jsx` |
| 대시보드 통계 | `api/routers/dashboard.py`, `api/routers/__init__.py`, `pages/dashboard/Dashboard.jsx` |
