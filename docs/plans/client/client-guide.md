# Phase 05: 클라이언트 구현 가이드

백오피스(Phase 1~4) 이후 진행. 상세 스펙은 별도 문서로 확정.

## 구현 순서

1. **메인·글 목록** (/)  
   - 2컬럼(70% 목록 / 30% 사이드바). 카드: 썸네일, 카테고리, 제목, 요약, 작성일·태그. 사이드: 프로필, 카테고리 리스트, 태그 클라우드. GET /api/posts (status=PUBLISHED).

2. **글 상세** (/posts/:postId)  
   - 제목, 메타, 본문(content_html), TOC, 태그, 이전/다음 글. 코드 블록 문법 강조·Copy 버튼, 이미지 라이트박스, 유튜브 임베드. Utterances 댓글.

3. **About** (/about)  
   - 인사말·자기소개. 경력 타임라인(GET /api/careers). 프로젝트 그리드(GET /api/projects)·카드 클릭 시 Accordion 확장.

4. **방명록** (/guestbook)  
   - 선택 사항. 기획서 기준 구현 여부 결정.

5. **공통**  
   - 헤더(로고, Posts, About, Guestbook, 다크모드 토글), 푸터(저작권, 소셜, Admin 링크). SEO: 동적 title·description·og:image. sitemap.xml 연동.

## 참조

- **[plans/client/](../client/)**: 상세 기획·Phase별 체크리스트 (00-client-implementation-guide.md, 01~05 phase 문서, client-phase-checklist.md).
- [02-api-spec.md](../../guides/common/02-api-spec.md): 공개 GET 엔드포인트.
- [04-design-guide.md](../../guides/common/04-design-guide.md), shared/ui-kit.
