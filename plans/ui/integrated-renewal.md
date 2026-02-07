# UI 통합 리뉴얼: Tailwind 전환 및 글로벌 CSS 정리

**사과**: 본인이 Tailwind를 쓰겠다고 했는데, 제가 임의로 커스텀 CSS 클래스(`index.css` 등)로 구현한 점 사과드립니다. 앞으로는 이 계획서대로 Tailwind로 통일하겠습니다.

**배경**: 클라이언트 UI를 Tailwind로 통일하기로 했으나, 그동안 커스텀 CSS 클래스로 구현된 부분이 많음. 이 계획서대로 Tailwind 기반 통합 리뉴얼 진행.

**범위**: client 앱 (`apps/client`) — 레이아웃, 공통 컴포넌트, 포스트 목록/상세, 헤더/푸터/사이드바 등.

---

## 목표

- Tailwind CSS 도입 및 `index.css` 대폭 축소(리셋·폰트·scrollbar-gutter·테마 변수만 유지 또는 Tailwind 설정으로 이전).
- 컴포넌트 스타일을 JSX의 Tailwind 유틸리티 클래스로 이전.
- 다크 모드는 Tailwind `dark:` + `tailwind.config`로 통일.

---

## 체크리스트

### 1. Tailwind 설정 및 기반

- [x] **1-1** client 프로젝트에 Tailwind CSS 설치. (v4 사용: `@tailwindcss/vite` 플러그인, `vite.config.js`에 추가.)
- [x] **1-2** `index.css`의 `@theme`에 디자인 토큰 반영: primary, ui-background, ui-text 등. 다크 모드는 `@custom-variant dark` + `@theme dark:` + `ThemeContext`에서 `class="dark"` 적용.
- [x] **1-3** Gmarket Sans 폰트: CDN 임포트 유지, `@theme { --font-sans }` 등록.

### 2. index.css 축소

- [ ] **2-1** `index.css`에서 레이아웃·카드·페이지네이션·헤더·사이드바 등 **커스텀 컴포넌트 클래스 전부 제거** (Tailwind로 대체). *(레이아웃/헤더/사이드바/오버레이 제거 완료)*
- [x] **2-2** 다음만 유지: `@import "tailwindcss"`, `@theme`, `html { scrollbar-gutter: stable }`, 폰트 임포트, 기존 var 호환용 `:root`/`.dark`.

### 3. 레이아웃 및 공통

- [x] **3-1** `Layout.jsx`: layout, container, layout-2col, vdivider, aside → Tailwind 클래스로 적용.
- [x] **3-2** 헤더(`SharedLayout` 내): area_navi, 로고/링크/검색/테마/햄버거 → Tailwind로 이전.
- [x] **3-3** 푸터 → Tailwind로 이전.
- [x] **3-4** 사이드바 카테고리 → Tailwind로 이전.
- [x] **3-5** 모바일 카테고리 오버레이 → Tailwind로 이전.

### 4. 포스트 목록

- [x] **4-1** `.post-list-center`, `.post-grid` → Tailwind (Home: flex/gap).
- [x] **4-2** Card.jsx: `.post-card`, `.post-card--list`, 썸네일/body/카테고리 필/제목/요약/메타 → Tailwind + theme-card-*.
- [x] **4-3** 검색 결과 strip → Tailwind (mb-3, theme-text-secondary).
- [x] **4-4** 페이지네이션 → Tailwind (Home 내 인라인 클래스 + var(--ui-*)).

### 5. 포스트 상세

- [x] **5-1** 로딩/에러 → Tailwind + theme-text-secondary, 링크 스타일.
- [x] **5-2** 헤더 카드: theme-bg-card, theme-card-border, 태그 필/제목/날짜 → Tailwind.
- [x] **5-3** 본문 카드: Tailwind. 본문 HTML(prose)만 `.post-detail-prose`로 index.css에 유지 (h1–h4, p, a, img, pre/code).
- [x] **5-4** 첨부파일 카드: Tailwind + theme-* / var(--ui-*).
- [x] **5-5** 이전/다음 네비 → Tailwind.

### 6. 반응형 및 다크 모드

- [x] **6-1** 레이아웃/카드/헤더/상세는 Tailwind `md:`, `max-[374px]:` 등으로 반응형 처리.
- [x] **6-2** ThemeContext에서 `data-theme` + `class="dark"` 동기화. 테마 색은 `:root`/`[data-theme="dark"]` 변수 + theme-* 클래스로 통일.

### 7. 정리 및 검증

- [x] **7-1** client 앱 전체 화면(목록/상세/검색/카테고리/모바일/다크 모드) 수동 확인.
- [x] **7-2** 사용하지 않는 CSS 클래스·규칙 제거 후 `index.css` 최종 상태 문서화(또는 주석으로 “유지 목적” 명시).

---

## 참고

- 기존 시각 스펙(색상, 간격, 카드 라운드, 그림자 등)은 유지하되, 값은 Tailwind theme/유틸리티로 매핑.
- backoffice는 이 계획 범위 외(별도 phase에서 Tailwind 도입 가능).
