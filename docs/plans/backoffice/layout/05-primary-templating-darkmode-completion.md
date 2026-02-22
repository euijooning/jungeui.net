# Primary 색상 템플릿화, 백오피스 다크모드 완성

구현 후 해당 항목을 체크.

참조: [02-implemented-features.md](02-implemented-features.md), [04-view-count-notifications-darkmode.md](04-view-count-notifications-darkmode.md)

---

## 1. 클라이언트 Primary 색상 템플릿화

**목표**: `#35C5F0`(메인), `#2BB8E3`(호버)를 **단일 소스**로 정의하고 나머지는 변수 참조만 하도록 정리.

**배경**: 기존에 `--color-primary` / `--color-primary-hover`(Tailwind @theme)와 `--ui-primary` / `--ui-primary-hover`(:root)에 동일 hex가 중복 정의되어 있었음.

**수정 파일**: `apps/client/src/index.css`

- [x] **1** `@theme`에만 hex 정의: `--color-primary: #35C5F0`, `--color-primary-hover: #2BB8E3`
- [x] **2** `:root` 및 `.dark`의 `--ui-primary`, `--ui-primary-hover`는 `var(--color-primary)`, `var(--color-primary-hover)` 참조로 변경
- [x] **3** 상단 주석 추가: "Primary 색상 단일 소스"

---

## 2. 백오피스 다크모드 완성 (베스트 프렉티스)

**목표**: AdminLayout 외 모든 목록·상세·필터·테이블·버튼·폼에 `dark:` 스타일 적용. 액센트 색을 하늘색에서 **초록색**으로 통일(수정·보기·새 글/검색 등).

**수정 파일**:
- `apps/backoffice/src/pages/posts/PostList.jsx`
- `apps/backoffice/src/pages/posts/PostDetail.jsx`
- `apps/backoffice/src/pages/careers/CareerList.jsx`
- `apps/backoffice/src/pages/projects/ProjectList.jsx`

- [x] **4** PostList: 헤더·필터 카드·select/input·검색 버튼·정렬·에러·테이블·thead/tbody/tr/td·체크박스·링크(제목/보기/수정)·페이지네이션에 `dark:` 적용. "새 포스트", "검색" 버튼 및 페이지 현재 번호를 초록색(green-600)으로 변경.
- [x] **5** PostDetail: 로딩·에러 카드·헤더 nav/제목·목록/삭제 버튼·본문 카드·메타 사이드바·첨부 파일 영역·statusBadge에 `dark:` 적용. 첨부 호버/다운로드 아이콘을 초록 계열로 통일.
- [x] **6** CareerList: 헤더·에러·테이블·드래그 타겟(bg-blue-50 → bg-green-50 dark)·버튼(새 경력 green)에 `dark:` 및 초록 액센트.
- [x] **7** ProjectList: 동일 패턴(헤더·에러·테이블·보기/수정/삭제 링크·새 프로젝트 버튼 green, dark: 적용).

**참고**: CategoryList, MessageList 등 MUI(Dialog/Button/TextField) 비중이 큰 페이지는 Tailwind `dark:`만 적용된 영역이 있고, MUI 컴포넌트는 별도 테마 전환 시 보강 가능.

---

## 3. 문서 정리

- [x] **8** plans/backoffice/layout/02-implemented-features.md에 §8(본 문서 요약) 및 관련 파일 표 반영.
- [x] **9** docs/guides/backoffice에 다크모드·primary 템플릿 정리 반영.

---

## 완료 점검

- [x] **10** 클라이언트에서 primary 색상 변경 시 `index.css` @theme 한 곳만 수정하면 전역 반영되는지 확인.
- [x] **11** 백오피스 다크모드 토글 시 포스트 목록·상세·경력·프로젝트 목록에서 배경·텍스트·테이블·버튼이 일관되게 전환되는지 확인.
