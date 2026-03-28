# 04-3. About 페이지 태그 섹션

구현 후 해당 항목을 체크. **Phase 완료 시 "완료 점검" 항목을 실행하고 보고.**

참조: [04-about.md](04-about.md), [02-post-list-and-sidebar.md](02-post-list-and-sidebar.md), [02-api-spec.md](../../guides/common/02-api-spec.md)

---

## 개요

- **위치**: `/about` 페이지, 인사말(하늘색 컨테이너) 아래에 **흰색 배경 분리 영역**으로 배치
- **가로 기준선**: 소개 영역과 동일 — Post 메뉴 왼쪽 ~ 다크모드 버튼 오른쪽 (`max-w-[1200px] mx-auto px-4 md:px-6`)
- **UI 디테일**: 태그 제목 가운데 정렬, 칩 텍스트 가운데 정렬, 제목-칩 간격 mb-6

---

## 1. UI 구조

- [x] **1** "태그" h1 텍스트 (검정색)
- [x] **2** 둥근 사각형(chip) 형태의 태그 버튼들
- [x] **3** 태그가 늘어나면 아래로 줄바꿈 (flex-wrap)
- [x] **4** 샘플 스타일: 연한 초록 배경, 둥근 모서리, 검정 텍스트

---

## 2. 데이터

- [x] **5** 태그 소스: 포스트에 `#oooo` 형식으로 연결된 태그 (post_tags)
- [x] **6** GET /tags 또는 태그+게시글 수 API로 목록 조회
  - (선택) 태그별 포스트 수 노출 `태그명 (N)` — API 확장 완료 (used_in_posts=true)

---

## 3. 클릭 동작 (필터 검색)

- [x] **7** 태그 클릭 시 → `/?tag={tag_id}` 또는 `/posts?tag={tag_id}` 이동
- [x] **8** Home(글 목록)에서 `tag` 쿼리 파라미터 읽어 `fetchPosts({ tag_id })` 전달
- [x] **9** `api.js` fetchPosts에 `tag_id` 파라미터 추가

---

## 4. API

- [x] **10** GET /tags 공개 목록 (이미 존재) — used_in_posts=true 시 post_count 포함
- [x] **11** GET /posts `tag_id` 필터 (이미 지원) — 클라이언트 연동 완료

---

## 완료 점검

- [x] `/about`에서 태그 섹션(제목 + chip 목록) 표시
- [x] 태그 클릭 시 해당 태그가 붙은 게시글 목록으로 필터 검색
- [x] 가로 폭이 소개 영역과 동일 (로고~다크모드 기준선)

**Phase 완료** (점검일: 2025-02-07)
