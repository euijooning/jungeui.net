# 테마·다크모드 정리

## 클라이언트 Primary 색상 (단일 소스)

- **파일**: `apps/client/src/index.css`
- **정의**: Primary 메인 `#35C5F0`, 호버 `#2BB8E3`는 **@theme 블록에만** 기입. `:root`와 `.dark`의 `--ui-primary`, `--ui-primary-hover`는 `var(--color-primary)`, `var(--color-primary-hover)`로 참조.
- **효과**: Primary 색을 바꿀 때 @theme 한 곳만 수정하면 클라이언트 전역에 반영됨.

## 백오피스 다크모드 (베스트 프렉티스)

- **방식**: Tailwind `darkMode: 'class'`. `document.documentElement`에 `dark` 클래스 토글, 선호도는 `localStorage`(`backoffice-theme`)에 저장.
- **적용 범위**:
  - **AdminLayout**: 헤더·사이드바·메인 배경, 알림/다크 토글, 유저 드롭다운.
  - **대시보드**: 카드·통계·바로가기·최근 활동.
  - **알림함**: NotificationsPage 카드·리스트.
  - **포스트 목록**: PostList 필터 카드, select/input, 테이블, thead/tbody, 페이지네이션, 에러 박스.
  - **포스트 상세**: PostDetail 헤더, 본문 카드, 메타·첨부 사이드바, statusBadge.
  - **경력/프로젝트 목록**: CareerList, ProjectList 테이블·헤더·에러·버튼.
- **액센트 색**: 백오피스 내 수정·보기·새 글/검색 등은 **초록색**(green-600 등)으로 통일.

## 참고

- 계획 상세: [plans/backoffice/layout/05-primary-templating-darkmode-completion.md](../../plans/backoffice/layout/05-primary-templating-darkmode-completion.md), [04-view-count-notifications-darkmode.md](../../plans/backoffice/layout/04-view-count-notifications-darkmode.md).
