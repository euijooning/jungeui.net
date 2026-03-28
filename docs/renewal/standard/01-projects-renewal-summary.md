# Projects 개편 구현 현황 정리

이 문서는 direction 문서(00, 01, 02)를 참고해, Projects 관련 **구현된 상태**를 한곳에 정리한 것이다. direction은 "방향/명세", standard는 "지금 이렇게 되어 있음" 정리 역할이다.

---

## 1. 관련 direction 문서

| 문서 | 내용 |
|------|------|
| [00-legacy-about.md](../direction/00-legacy-about.md) | About 레거시: API·데이터·백오피스 메시지/소개문구. |
| [01-portfolio-and-about-reform.md](../direction/01-portfolio-and-about-reform.md) | About→Projects/Portfolio 전환, 백오피스 포트폴리오 관리. |
| [02-projects-grid-and-backoffice.md](../direction/02-projects-grid-and-backoffice.md) | Projects 그리드·컨테이너·백오피스 재추가 명세. |

---

## 2. 클라이언트 Projects 현재 스펙

- **라우트**: `/projects`
- **데이터**: `fetchTags({ used_in_posts: true })`, `fetchProjects()`, `fetchProjectsCareersIntro()`
- **섹션 순서**: 프로젝트(위) → 태그(아래). 배경 풀폭(`relative left-1/2 -translate-x-1/2 w-screen`), 내부 `max-w-[1200px] mx-auto px-4 md:px-6`
- **태그 영역**: 상하 여백 없이 붙음. 레이아웃 본문 `pt-4 pb-8`을 상하로 당기는 래퍼 `-mt-4 -mb-8` + 첫 섹션 `pt-4`
- **프로젝트 카드**: 2열 그리드(`grid-cols-1 md:grid-cols-2`), 카드 외곽선 `border-gray-300 dark:border-gray-600`, 클릭 시 `notion_url` 새 창
- **푸터**: 상단 구분선 `border-t-2 border-gray-200 dark:border-gray-300` (Layout.jsx)

---

## 3. 백오피스 프로젝트 관리 현재 스펙

- **라우트**: `/projects`(목록), `/projects/new`(등록), `/projects/:id/edit`(수정)
- **목록**: 테이블(순서·번호·제목·기간·작업), 드래그 reorder, 보기(ProjectDetailModal)/수정/삭제, 소개문구 인라인 편집 유지, 페이지 배경 `bg-[#F0F9FF]`
- **보기**: ProjectDetailModal — 보기 전용, 수정 시 `/projects/:id/edit`로 이동

---

## 4. 채팅에서 반영된 변경 요약 (파일별)

- **Projects.jsx**: 태그/프로젝트 배경 풀폭 + 내부 max-w; 섹션 순서 프로젝트→태그; 래퍼 `-mt-4 -mb-8`·첫 섹션 `pt-4`로 태그 영역 상하 여백 제거
- **ProjectCard.jsx**: 카드 외곽선 강화 `border-gray-300 dark:border-gray-600`
- **Layout.jsx**: 푸터 상단 구분선 `border-t-2 border-gray-200 dark:border-gray-300`
- **ProjectDetailModal.jsx**: 신규, 보기 전용 모달, 수정 시 edit 페이지 이동
- **ProjectList.jsx**: 테이블·드래그 reorder·보기/수정/삭제, 소개문구 인라인, 배경 `bg-[#F0F9FF]`
- **02-projects-grid-and-backoffice.md**: 구현 현황·참고 구현(8-1~8-3) 반영
