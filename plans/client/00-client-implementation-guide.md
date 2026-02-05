# 클라이언트 구현 가이드 (Jungeui Lab)

참조: [docs/01-db-schema.md](../../docs/common/01-db-schema.md), [docs/02-api-spec.md](../../docs/common/02-api-spec.md), [docs/03-folder-structure.md](../../docs/common/03-folder-structure.md), [docs/04-design-guide.md](../../docs/common/04-design-guide.md)

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
| 1 | [01-design-and-ui-kit.md](01-design-and-ui-kit.md) | 디자인 가이드·공통 컴포넌트 (하늘색/연파랑, Button/Card/Layout 등) |
| 2 | [02-post-list-and-sidebar.md](02-post-list-and-sidebar.md) | 루트·포스트 목록, 우측 게시판(카테고리), 박스형 리스트, 페이지네이션(5개), 카테고리명 표시, 검색 결과 |
| 3 | [03-post-detail.md](03-post-detail.md) | 글 상세 (/posts/:postId), TOC, Utterances 댓글 |
| 4 | [04-about.md](04-about.md) | 소개 페이지, 경력 타임라인, 프로젝트 그리드 |
| 5 | [05-common-layout-seo-footer.md](05-common-layout-seo-footer.md) | 헤더(로고·검색·메뉴·다크모드), 푸터(이메일·저작권), SEO·sitemap |

요약 체크리스트: [client-phase-checklist.md](client-phase-checklist.md)

## 초기기획서 대비 변경 사항

- 상세 스펙은 본 폴더의 phase 문서 및 docs·client-guide 기준으로 확정. PDF 초기기획서와 차이가 있으면 이 문서에 요약하여 반영.
