# 클라이언트 Phase별 체크리스트

구현 후 해당 항목을 체크. **한 Phase 끝날 때마다 해당 Phase의 "완료 점검" 항목을 실행하고 보고.**

참조: [00-client-implementation-guide.md](00-client-implementation-guide.md), [docs/02-api-spec.md](../../docs/common/02-api-spec.md)

---

## Phase 01: 디자인 가이드·공통 컴포넌트

**문서**: [01-design-and-ui-kit.md](01-design-and-ui-kit.md)

- [ ] **1** 브랜드 컬러: 하늘색·연한 파랑 계열 (primary, secondary, 배경/텍스트).
- [ ] **2** 04-design-guide 연동: 가독성, 다크/라이트 테마.
- [ ] **3** 테마 토글 시 Utterances·코드 블록 일괄 전환.
- [ ] **4** theme.js 또는 colors.js (shared/ui-kit).
- [ ] **5** Button (primary/secondary/ghost, 다크 대응).
- [ ] **6** Card (썸네일·제목·요약·메타).
- [ ] **7** Layout (헤더+메인+푸터, 2컬럼 옵션).
- [ ] **8** Modal/라이트박스 (이미지 확대).

### Phase 01 완료 점검

- [ ] **9** theme 적용·다크/라이트 전환·컴포넌트 import 사용 가능.

---

## Phase 02: 포스트 목록·사이드바

**문서**: [02-post-list-and-sidebar.md](02-post-list-and-sidebar.md)

- [ ] **10** `/`·`/posts` → 동일 목록 페이지.
- [ ] **11** 2컬럼 (70% 목록 / 30% 사이드바).
- [ ] **12** 박스형 리스트, 페이지당 5개, 페이지네이션.
- [ ] **13** 카테고리 선택 시 카테고리명 표시.
- [ ] **14** 사이드바: 카테고리 리스트 (GET /categories), 태그 클라우드(선택).
- [ ] **15** GET /posts (PUBLISHED), 카테고리 필터.
- [ ] **16** 카드 클릭 → `/posts/:postId`.
- [ ] **17** 검색 결과: 박스형 리스트, 5개/페이지, 페이지네이션 (검색 버튼 클릭 시).

### Phase 02 완료 점검

- [ ] **18** 목록·카테고리 필터·검색 결과·페이지네이션 동작.

---

## Phase 03: 글 상세

**문서**: [03-post-detail.md](03-post-detail.md)

- [ ] **19** 경로 `/posts/:postId`, GET /posts/{id}. 조회수 미노출.
- [ ] **20** 제목·메타·본문(content_html), TOC.
- [ ] **21** 코드 블록 문법 강조·Copy, 이미지 라이트박스, 유튜브 임베드.
- [ ] **22** 이전/다음 글, Utterances 댓글 (다크모드 테마 전환).

### Phase 03 완료 점검

- [ ] **23** 상세·TOC·코드·이미지·Utterances 동작.

---

## Phase 04: 소개 (About)

**문서**: [04-about.md](04-about.md)

- [ ] **24** 경로 `/about`, 인사말·자기소개.
- [ ] **25** 경력: GET /careers, 타임라인/리스트.
- [ ] **26** 프로젝트: GET /projects, 그리드·Accordion 확장.

### Phase 04 완료 점검

- [ ] **27** About·경력·프로젝트 API 연동 표시.

---

## Phase 05: 공통·SEO·푸터

**문서**: [05-common-layout-seo-footer.md](05-common-layout-seo-footer.md)

- [ ] **28** 상단 검색: 제목 일치, 검색 버튼 클릭 시 실행, 결과 리스트.
- [ ] **29** 헤더: 로고, Posts·소개·이력서(추후), 다크모드 토글.
- [ ] **30** 푸터: 이메일, "© 2026 Jungeui Lab. All rights reserved.", Admin 링크.
- [ ] **31** SEO: 동적 title·description·og:image. sitemap.xml 연동.

### Phase 05 완료 점검

- [ ] **32** 헤더·푸터·검색·SEO·sitemap 동작.

---

## 요약

| Phase     | 구현 항목 | 완료 점검 |
|-----------|-----------|-----------|
| Phase 01  | 1~8       | 9         |
| Phase 02  | 10~17     | 18        |
| Phase 03  | 19~22     | 23        |
| Phase 04  | 24~26     | 27        |
| Phase 05  | 28~31     | 32        |

**한 Phase 끝나면 해당 Phase의 완료 점검 항목을 체크하고 보고.**
