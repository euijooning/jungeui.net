# 누적 조회수 수정, 알림함, 다크모드

구현 후 해당 항목을 체크.

참조: [02-implemented-features.md](02-implemented-features.md), [03-phase-checklist.md](03-phase-checklist.md)

---

## 1. 누적 조회수 수정

**목표**: 클라이언트 글 상세 클릭 시 조회수가 대시보드 누적 조회수에 바로 반영되도록 함.

**원인**: `GET /api/dashboard/stats`의 `total_views`가 `WHERE date < :dt`(전일까지)만 합산해 오늘 조회가 제외됨.

**수정 파일**: `apps/api/routers/dashboard.py`

- [x] **1** 누적 조회수 쿼리를 오늘 포함으로 변경: `WHERE date <= :dt`
- [x] **2** docstring: "전일까지" → "오늘 포함"으로 수정

---

## 2. 알림함(최근 활동) 페이지

**목표**: 헤더에 알림(종) 아이콘 추가, `/notifications` 알림함 페이지를 베스트 프렉티스 UI로 구성.

**수정·추가 파일**:
- `apps/backoffice/src/components/AdminLayout.jsx`
- `apps/backoffice/src/pages/notifications/NotificationsPage.jsx`
- `apps/backoffice/src/App.jsx`

- [x] **3** AdminLayout: 헤더 오른쪽 유저 메뉴 왼쪽에 종(bell) 아이콘 링크 → `/notifications`
- [x] **4** getPageTitle: `"/notifications": "알림"` 추가
- [x] **5** NotificationsPage: `GET /api/dashboard/recent-activity` 연동, 리스트 형태(제목·slug·status·수정일), 클릭 시 `/posts/:id` 이동, 로딩/에러/빈 목록 처리
- [x] **6** App.jsx: `/notifications` 라우트 (NotificationsPage)

---

## 3. 다크모드

**목표**: 알림 아이콘 옆에 다크모드 토글 아이콘, class 기반 Tailwind 다크 테마, localStorage 저장.

**수정 파일**:
- `apps/backoffice/tailwind.config.js`
- `apps/backoffice/src/main.jsx`
- `apps/backoffice/src/components/AdminLayout.jsx`
- `apps/backoffice/src/pages/dashboard/Dashboard.jsx`
- `apps/backoffice/src/pages/notifications/NotificationsPage.jsx`

- [x] **7** tailwind.config.js: `darkMode: 'class'` 추가
- [x] **8** main.jsx: 초기 로드 시 `localStorage.getItem('backoffice-theme') === 'dark'`면 `document.documentElement.classList.add('dark')` (플래시 방지)
- [x] **9** AdminLayout: `isDark` 상태, localStorage `backoffice-theme` 동기화, 헤더에 해/달 토글 버튼(알림 오른쪽), 루트·헤더·메인·드롭다운에 `dark:` 스타일
- [x] **10** Dashboard: 카드·텍스트·버튼에 `dark:` 스타일
- [x] **11** NotificationsPage: 카드·텍스트·리스트에 `dark:` 스타일

---

## 완료 점검

- [x] **12** 클라이언트에서 글 상세 조회 후 백오피스 대시보드에서 누적 조회수 증가 확인.
- [x] **13** 헤더 종 아이콘 클릭 시 알림함 페이지 진입, 최근 활동 목록 표시 및 글 클릭 시 상세 이동.
- [x] **14** 다크모드 토글 시 전체 톤 전환, 새로고침 후에도 선호 유지.
