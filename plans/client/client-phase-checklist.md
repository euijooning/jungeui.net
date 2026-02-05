# 클라이언트 Phase별 체크리스트

구현 후 해당 항목을 체크. **한 Phase 끝날 때마다 해당 Phase의 "완료 점검" 항목을 실행하고 보고.**

참조: [00-client-implementation-guide.md](00-client-implementation-guide.md), [docs/02-api-spec.md](../../docs/common/02-api-spec.md)

**이 가이드의 목표:** "디자인 흔들림 없는 sungbin.dev 급 구조 + 유지보수 가능한 색상 체계"

---

## Phase 01: 글로벌 레이아웃·색상 테마·공통 컴포넌트

**문서**: [01-design-and-ui-kit.md](01-design-and-ui-kit.md)

- [x] **1** 기본 컨테이너 (max-width 1200px, 좌측 정렬).
- [x] **2** 2컬럼 레이아웃 (7fr 3fr), 모바일 시 사이드바 하단.
- [x] **3** 색상 테마: Admin 사이드바 = sky-500, 버튼/링크 = #35C5F0 (theme.js).
- [x] **4** 절대 섞지 말 것: 사이드바에 #35C5F0 ❌, 버튼에 sky-500 ❌.
- [x] **5** 다크 모드: 배경 #0f172a, 카드 #111827, primary 유지. (Utterances 연동은 Phase 03)
- [x] **6** Button, Card, Layout, 라이트박스 (shared/ui-kit).

### Phase 01 완료 점검

- [x] **7** theme 적용·다크/라이트 전환·컴포넌트 import 사용 가능.

---

## Phase 02: 포스트 목록·사이드바 (카드 그리드)

**문서**: [02-post-list-and-sidebar.md](02-post-list-and-sidebar.md)

- [ ] **8** `/`·`/posts` → 동일 목록 페이지.
- [ ] **9** 2컬럼 (70% 목록 / 30% 사이드바).
- [ ] **10** 카드 그리드: 반응형 (≥1280: 5 / ≥1024: 4 / ≥768: 3 / ≥480: 2 / Mobile: 1).
- [ ] **11** 카드 구조: Thumbnail 16:9, Title max 2줄, Summary max 3줄, hover translateY(-4px).
- [ ] **12** 페이지당 5개, 페이지네이션.
- [ ] **13** 사이드바: 카테고리 리스트 (GET /categories), 카테고리 선택 시 필터.
- [ ] **14** GET /posts (PUBLISHED), 카드 클릭 → `/posts/:postId`.
- [ ] **15** 검색 결과: 카드 그리드 재사용, 버튼 클릭 시 실행.

### Phase 02 완료 점검

- [ ] **16** 목록·카테고리 필터·검색 결과·페이지네이션 동작.

---

## Phase 03: 글 상세

**문서**: [03-post-detail.md](03-post-detail.md)

- [ ] **17** 경로 `/posts/:postId`, GET /posts/{id}. 조회수 미노출.
- [ ] **18** 레이아웃: 제목·메타 → 본문(좌정렬) | TOC(sticky) → 이전/다음글 → Utterances.
- [ ] **19** 본문: text-align left, line-height 1.7~1.8, 이미지 클릭 → 라이트박스.
- [ ] **20** 코드 블록 문법 강조·Copy, 유튜브 임베드.
- [ ] **21** Utterances 댓글 (다크모드 테마 전환).

### Phase 03 완료 점검

- [ ] **22** 상세·TOC·코드·이미지·Utterances 동작.

---

## Phase 04: 소개 (About)

**문서**: [04-about.md](04-about.md)

- [ ] **23** 경로 `/about`, 구성: 인사말 → 경력(Timeline) → 프로젝트(Grid Card).
- [ ] **24** 경력: GET /careers, 세로 타임라인, 회사명/직함/기간/설명.
- [ ] **25** 프로젝트: GET /projects, 글 목록 카드와 동일한 카드, Accordion 또는 상세 토글.

### Phase 04 완료 점검

- [ ] **26** About·경력·프로젝트 API 연동 표시.

---

## Phase 05: 공통·SEO·푸터

**문서**: [05-common-layout-seo-footer.md](05-common-layout-seo-footer.md)

- [ ] **27** 헤더: [검색창] [로고] Posts About Resume 🌙
- [ ] **28** 검색: 제목 기준, 버튼 클릭 시만, 결과는 카드 그리드 재사용.
- [ ] **29** 푸터: 이메일, "© 2026 Jungeui Lab. All rights reserved.", Admin 링크.
- [ ] **30** SEO: 동적 title·description·og:image, sitemap.xml 연동.

### Phase 05 완료 점검

- [ ] **31** 헤더·푸터·검색·SEO·sitemap 동작.

---

## 9. 최종 구현 체크리스트 (PDF v3)

### 레이아웃

- [x] 모든 페이지 max-width 유지
- [x] 2컬럼 구조 통일 (7fr 3fr)

### 리스트

- [ ] 카드형 그리드
- [ ] 반응형 정상 (5/4/3/2/1 컬럼)

### 색상

- [ ] 사이드바 = sky-500 (Admin, 별도 검증)
- [x] 버튼/링크 = #35C5F0
- [x] 다크모드 전환 정상

---

## 요약

| Phase     | 구현 항목 | 완료 점검 |
|-----------|-----------|-----------|
| Phase 01  | 1~6       | 7         |
| Phase 02  | 8~15      | 16        |
| Phase 03  | 17~21     | 22        |
| Phase 04  | 23~25     | 26        |
| Phase 05  | 27~30     | 31        |

**한 Phase 끝나면 해당 Phase의 완료 점검 항목을 체크하고 보고.**
