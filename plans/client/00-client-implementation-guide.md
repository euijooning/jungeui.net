# 클라이언트 구현 가이드 (Jungeui Lab)

참조: [docs/01-db-schema.md](../../docs/common/01-db-schema.md), [docs/02-api-spec.md](../../docs/common/02-api-spec.md), [docs/03-folder-structure.md](../../docs/common/03-folder-structure.md), [docs/04-design-guide.md](../../docs/common/04-design-guide.md)

## 0. 전체 설계 철학 (필독)

**UI 핵심 원칙**

- 모든 콘텐츠는 중앙 컨테이너 안에서 **좌우 정렬** (본문 가운데 띄우기 ❌, 좌측 정렬 기본 ⭕)
- 리스트는 무조건 **카드형(Box) + Grid**
- 관리자(Admin)와 클라이언트(Client)는 **색상 체계 분리**
- Tailwind 색상은 "구조/UI용", Theme(MUI)는 "행동/포인트용"

## 목표

방문자용 블로그·포트폴리오 클라이언트. 로그인/회원가입 없음, 공개 읽기 전용.

## 범위

- **조회수**: 클라이언트(글 목록·글 상세)에는 **노출하지 않음**. 조회수·방문자 통계는 **백오피스에서만** 조회·팔로우업 (GET /dashboard/stats, daily_stats 등).
- **메뉴**: Posts(루트), 소개(About), 이력서(추후 추가). 방명록은 선택 사항.

## 라우팅

| 경로 | 설명 |
|------|------|
| `/` | 게시글 목록 (메인) |
| `/posts` | 게시글 목록 (동일 페이지) |
| `/posts/:postId` | 글 상세 |
| `/about` | 소개 (경력·프로젝트) |
| 이력서 | 추후 추가 |

## 레퍼런스

- [sungbin.dev](https://sungbin.dev/) — 메인·목록·헤더 메뉴
- [codegradation.tistory.com](https://codegradation.tistory.com/) — 2컬럼·사이드바·검색·카테고리명 표시
- [sungbin.dev/about](https://sungbin.dev/about/) — 소개 페이지·경력·프로젝트

## 구현 순서

| Phase | 문서 | 내용 |
|-------|------|------|
| 1 | [01-design-and-ui-kit.md](01-design-and-ui-kit.md) | 글로벌 레이아웃·색상 테마·공통 컴포넌트 |
| 2 | [02-post-list-and-sidebar.md](02-post-list-and-sidebar.md) | 카드 그리드·2컬럼·페이지네이션·카테고리·검색 |
| 3 | [03-post-detail.md](03-post-detail.md) | 글 상세 (/posts/:postId), TOC, Utterances 댓글 |
| 4 | [04-about.md](04-about.md) | 소개 페이지·경력 타임라인·프로젝트 그리드 |
| 5 | [05-common-layout-seo-footer.md](05-common-layout-seo-footer.md) | 헤더·푸터·SEO·sitemap |

요약 체크리스트: [client-phase-checklist.md](client-phase-checklist.md)

## 8. 절대 금지 사항

- 가운데 정렬된 본문
- 카드 크기 제각각
- 리스트 아닌 텍스트 나열
- Tailwind sky 색을 버튼에 사용
- theme primary를 사이드바에 사용

## 초기기획서 대비 변경 사항

- 상세 스펙은 본 폴더의 phase 문서 및 docs·client-guide 기준으로 확정. PDF 초기기획서와 차이가 있으면 이 문서에 요약하여 반영.
