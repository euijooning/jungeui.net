# Portfolio·Projects 개편 및 docs 재구조화

클라이언트: About → Projects 전환, Resume → Portfolio 신규. 백오피스: 포트폴리오 관리(메시지만), 프로젝트·경력 메뉴/라우트·파일 제거. docs legacy/renewal 구조 정리.

---

## A. 클라이언트 변경

### 방향 요약

| 구분 | 변경 전 | 변경 후 |
|------|--------|--------|
| **현재 About 페이지** | `/about` (인사말+메시지+연락처+태그+프로젝트+경력) | **Projects 페이지**: `/projects`, 태그+프로젝트 캐러셀+경력만 유지 |
| **Resume (주석)** | 외부 링크 주석 처리 | **Portfolio 페이지** 신규: `/portfolio`, 메시지 관리 데이터 + "끝내는 기획자 ~" + 연락처 |

### A1. Portfolio (`/portfolio`) — 신규

- **목적:** 소개/정체성 페이지. 백오피스 "메시지 관리" 데이터 노출 + 그에 이어지는 헤드라인 + 연락처.
- **상단:** `GET /api/about/messages` 메시지 최대 3개 (현재 About의 메시지 3개 그리드와 동일 UI).
- **이어서:** "끝내는 기획자", "정의준입니다." 영역 (메시지에서 파생되어 나오게 구성).
- **추가:** 연락처(mailto) 버튼.
- **데이터:** `fetchAboutMessages()` 만 사용.
- **구현:** `apps/client/src/pages/Portfolio.jsx` 신규. `document.title = 'Portfolio'`.

### A2. Projects (`/projects`) — 기존 About 대체

- **목적:** 작업/포트폴리오 목록. 태그, 프로젝트 캐러셀, 경력 버튼·모달.
- **구성:** 태그 섹션, 프로젝트·경력 섹션(제목, 경력 버튼, projectsCareersIntro, ProjectCard 캐러셀, CareerModal).
- **제거:** 상단 헤더("끝내는 기획자, 정의준입니다."), 메시지 3개, 연락처 (→ Portfolio로 이동).
- **구현:** About.jsx → Projects.jsx 로 전환(파일명·컴포넌트명), 상단 섹션 및 `fetchAboutMessages` 제거. 라우트 `/projects`.

### A3. 라우팅·네비게이션

- **App.jsx:** `/about` 제거. `/projects` → Projects, `/portfolio` → Portfolio 추가.
- **SharedLayout.jsx:** "About" → "Projects", `to="/projects"`. Resume 주석 제거 후 "Portfolio", `to="/portfolio"` (데스크톱·모바일 동일).

---

## B. 백오피스: 포트폴리오 관리 + 프로젝트/경력 제거

### B1. 섹션명·아이콘 변경

- **AdminLayout.jsx** (`apps/backoffice/src/components/AdminLayout.jsx`):
  - "소개 관리" → **"포트폴리오 관리"** 로 변경.
  - 아이콘: `about: User` 대신 캔버스/포트폴리오에 어울리는 아이콘 (lucide-react `LayoutGrid` 또는 `Palette` 권장).
  - `navSections` 내 해당 섹션의 `title`, `icon` 수정. `singleLinkHref`는 `/messages` 유지.
  - 아코디언 열림 조건·single 링크 활성 조건 등에서 "소개 관리" 문자열을 "포트폴리오 관리"로 일괄 변경.

### B2. 프로젝트·경력 메뉴 및 라우팅 삭제

- **App.jsx** (`apps/backoffice/src/App.jsx`):
  - `ProjectList`, `ProjectNew`, `CareerList`, `CareerNew` import 제거.
  - `<Route path="/careers" ...>`, `<Route path="/careers/new" ...>`, `<Route path="/projects" ...>`, `<Route path="/projects/new" ...>` 제거.
- **AdminLayout.jsx**:
  - "포트폴리오 관리" 아코디언의 `items`에서 프로젝트·경력 항목 제거. `items`는 `[{ href: "/messages", icon: "messages", label: "메시지" }]` 만 유지.
  - `currentPath` 분기: `/careers`, `/projects` 관련 조건 제거. 아코디언 자동 오픈은 `currentPath === "/messages"` 만 남김.
  - getPageTitle(브레드크럼용 title 맵)에서 `/careers`, `/careers/new`, `/projects`, `/projects/new` 및 관련 정규식 제거.
  - ICON_MAP에서 `projects`, `careers` 키는 삭제 (다른 곳 미사용 시).

### B3. 삭제할 파일 (백오피스)

- **pages/projects/** 전체 삭제: ProjectList.jsx, ProjectNew.jsx, ProjectEdit.jsx, ProjectForm.jsx, ProjectDetailModal.jsx, ProjectFormModal.jsx, SortableTag.jsx.
- **pages/careers/** 전체 삭제: CareerList.jsx, CareerNew.jsx, CareerForm.jsx, CareerFormModal.jsx.
- **디렉터리:** `apps/backoffice/src/pages/projects`, `apps/backoffice/src/pages/careers` 폴더 삭제.

---

## C. docs 폴더 재구조화

### C1. 디렉터리 구조

**변경 후:**

```
docs/
  legacy/
    guides/
    plans/
  renewal/
    standard/
    direction/
```

- `docs/guides` → `docs/legacy/guides` 로 이동.
- `docs/plans` → `docs/legacy/plans` 로 이동.
- `docs/renewal/standard`, `docs/renewal/direction` 생성.

### C2. direction 문서

- **이동:** `docs/ABOUT_PAGE.md` → `docs/renewal/direction/00-legacy-about.md` (이름 변경하여 이동).
- **신규/정리:** `docs/renewal/direction/01-portfolio-and-about-reform.md` — 본 개편 계획 (A·B·C) 정리.

---

## 참고

- Resume 메뉴는 제거되고 Portfolio로 대체됨. About 링크는 Projects로 대체됨.
- 백오피스에서 프로젝트·경력 **관리 화면만 제거**. 백엔드 API(`/api/projects`, `/api/careers`)와 클라이언트 Projects 페이지 노출은 유지. 데이터 수정은 API 직접 호출 등 다른 수단 사용 가능.
- **"끝내는 기획자, 정의준입니다"** 표시: 고정 문구로 둘지, 메시지 1번 등으로 동적 표시할지는 구현 단계에서 결정. **첫 구현은 고정 문구 + 메시지 3개 블록으로 해도 무방함.**
