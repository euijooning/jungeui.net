# 백오피스 UI 총체 가이드

백오피스(`apps/backoffice`)의 테마·다크모드·폰트·사이드바·레이아웃·로그인 등 UI 관련 설정을 한 곳에 정리한 문서입니다.

참조: [backoffice/01-implementation-guide.md](../backoffice/01-implementation-guide.md), [backoffice/03-phase-02-posts-and-editor.md](../backoffice/03-phase-02-posts-and-editor.md), [client/04-post-detail.md](../client/04-post-detail.md), [plans/client/08-post-detail-prose-h5-h6.md](../../plans/client/08-post-detail-prose-h5-h6.md).

---

## 1. 진입점·테마 적용

| 파일 | 역할 |
|------|------|
| **main.jsx** | `index.css` import. 다크모드 복원: `localStorage.getItem('backoffice-theme') === 'dark'`이면 `document.documentElement.classList.add('dark')`, 아니면 제거. (플래시 방지) |
| **App.jsx** | React-Admin `<Admin>`에 `theme={adminTheme}` 전달. `layout`에서 `AdminLayout` 사용. |
| **AdminTheme.js** | MUI/React-Admin 테마 객체. `typography`, `palette`, `sidebar`, `header`, `main`, `paper`, `table`, `button`, `form`, `status` 등. |

---

## 2. 테마 객체 (AdminTheme.js)

- **typography.fontFamily**: NexonLv1Gothic 1순위 (MUI 컴포넌트 전역). 없으면 MUI 기본(Roboto) 등 적용됨.
- **palette**: primary `#061F40`, light `#062540`, dark `#051326`. secondary, background, text.
- **sidebar**: width 15rem, collapsedWidth 4rem, backgroundColor primary.
- **header**: height 4rem, 배경·보더·섀도우.
- **main**: 배경색, minHeight, padding.
- **paper / table / button / form / status**: 카드·테이블·버튼·폼·상태 색상.
- **adminComponentStyles**: 메뉴 아이템, 데이터 테이블, 필터 폼, 액션 버튼용 스타일 참고.

클라이언트 Primary 단일 소스는 Client `index.css`의 `@theme` (#35C5F0, #2BB8E3). 백오피스는 별도 primary(#061F40) 사용.

---

## 3. 다크 모드

- **방식**: Tailwind `darkMode: 'class'`. `document.documentElement`에 `dark` 클래스 토글. 선호도 `localStorage` 키 `backoffice-theme` (값 `light` / `dark`).
- **토글 위치**: AdminLayout 헤더 우측(다크/라이트 아이콘).
- **적용 범위**: AdminLayout(헤더·사이드바·메인), 대시보드, 알림함, PostList, PostDetail, CareerList, ProjectList 등. Tailwind `dark:` 및 index.css 내 `.dark .Mui*` 오버라이드.
- **액센트 색**: 백오피스 내 수정·보기·새 글·검색 등은 **초록색**(green-600 등)으로 통일.
- **index.css**: `.dark .MuiDialog-paper`, `.MuiOutlinedInput-root`, `.MuiInputLabel-root`, `.MuiPopover-paper`, `.MuiMenuItem-root` 등 다크 배경·테두리·텍스트 색 정의.

---

## 4. 전역 폰트 (Nexon Lv1 Gothic)

Client와 동일한 Nexon 적용으로 WYSIWYG·일관된 타이포그래피 유지.

| 위치 | 내용 |
|------|------|
| **AdminTheme.js** | `typography.fontFamily`: NexonLv1Gothic, Pretendard, ui-sans-serif, system-ui, … |
| **index.css** | `@font-face` Nexon Light/Normal/Bold (눈누 CDN). `html, body { font-family: 'NexonLv1Gothic', ... }`. (Pretendard @import는 제거됨) |
| **tailwind.config.js** | `theme.extend.fontFamily.sans` 첫 값 NexonLv1Gothic. |
| **PostDetail.jsx** | `.admin-prose`용 인라인 `<style>` 안에 Nexon `@font-face` 3개 + `.admin-prose { font-family: 'NexonLv1Gothic', ... }`. 미리보기에서 확실히 로드되도록. |

---

## 5. 레이아웃 (AdminLayout.jsx)

- **구조**: 좌측 LNB(사이드바) + 메인(헤더 + children). 1280px 미만에서는 사이드바 숨김, 햄버거로 오버레이.
- **사이드바 헤더**: 로고(favicon) + "JUNGEUI LAB" (ADMIN 텍스트 없음). `getPageTitle()` 기본값 "JUNGEUI LAB", 탭 제목은 "페이지명 | 관리자".
- **네비**: 대시보드(단일), 포스트 관리(아코디언: 목록/카테고리/말머리), 소개 관리(아코디언: 메시지/프로젝트/경력). Lucide 아이콘.
- **접힌 상태(collapsed)**: 텍스트 숨김, 아이콘만 표시. **index.css** `.lnb-container.collapsed .nav-item > *:first-child { margin-right: 0 !important; }`로 아이콘 가운데 정렬.
- **헤더**: 햄버거 또는 사이드바 토글 + getPageTitle(), 알림 링크, 다크 토글, 유저 드롭다운(로그아웃). 401/403 시 session-expired 모달 → 확인 시 로그인 페이지.

---

## 6. 로그인 (LoginPage.jsx)

- **진입**: React-Admin `loginPage={LoginPage}`, `requireAuth`. MUI Box/Card/TextField/Button/Checkbox/Dialog.
- **배경**: `linear-gradient(135deg, #061F40 0%, #062540 100%)`.
- **카드**: 제목 "정의랩 관리자", 이메일/비밀번호, 비밀번호 보기 토글, "로그인 유지 (최대 30일)", 로그인 버튼(primary #061F40).
- **document.title**: "관리자 로그인 | 정의랩". cleanup 시 "정의랩 관리자".
- **로그인 만료 모달**: `sessionStorage.getItem('login_expired_reason') === 'session_expired'` 시 Dialog 표시.

---

## 7. 전역 스타일 (index.css)

- **폰트**: @font-face Nexon 3종, html/body font-family.
- **스크롤바**: `.custom-scrollbar` (트랙/썸/호버). `.lnb-content.custom-scrollbar` 다크용.
- **Lucide**: `.lucide-icon` 크기·stroke·opacity, button/a 호버 시 opacity 1.
- **사이드바**: `.lnb-content`, `.nav-item`, `.space-y-1 > *`. collapsed 시 `.sidebar-text` 숨김, `.nav-item` justify-content center·첫 자식 margin 0, `.lnb-content` 패딩.
- **오버레이 모드**: 1279px 이하에서 `.sidebar-overlay-mode` fixed, transform. `body.sidebar-overlay-open` 시 표시.
- **ProseMirror/tiptap**: h1/h2/h3, p, focus 아웃라인 제거 (에디터용).
- **로딩**: `.loading-spinner` 키프레임.
- **다크 MUI**: Dialog, OutlinedInput, InputLabel, Popover/Menu, List 등 배경·테두리·글자색.

---

## 8. 본문 제목 h5/h6 (WYSIWYG)

Client·에디터·미리보기 3곳 동일 계층으로 h5/h6가 본문보다 작아지지 않도록 적용.

| 위치 | 내용 |
|------|------|
| **Client index.css** | `.post-detail-prose` h5: 1.0625rem, h6: 1rem + 보조색, margin-top 2rem. word-break keep-all. |
| **PostEditor.jsx** | TinyMCE `content_style`: h1~h6 블록. h5 16px, h6 15px + #666, margin-top 2em. |
| **PostDetail.jsx** | `.admin-prose` h5/h6 추가. h5 1.0625rem, h6 1rem + #6B7280. 다크: h5 #f3f4f6, h6 #9ca3af. |

---

## 9. 요약 표

| 항목 | 파일 | 요약 |
|------|------|------|
| 테마·다크 복원 | main.jsx, AdminLayout | dark 클래스, backoffice-theme localStorage |
| MUI 테마 | AdminTheme.js | typography, palette, sidebar, header, main, paper, table, button, form, status |
| 전역 폰트 | AdminTheme.js, index.css, tailwind.config | Nexon 1순위, @font-face, html/body, fontFamily.sans |
| 미리보기 폰트 | PostDetail.jsx | .admin-prose @font-face + font-family 인라인 |
| 사이드바 | AdminLayout.jsx, index.css | JUNGEUI LAB만, getPageTitle, collapsed 아이콘 가운데 |
| 로그인 | LoginPage.jsx | gradient #061F40, MUI 폼, document.title |
| 본문 h5/h6 | Client index.css, PostEditor, PostDetail | 3곳 동일 계층 (h5 본문 크기, h6 보조색) |
| 다크 MUI | index.css | .dark .Mui* 배경·테두리·텍스트 |
