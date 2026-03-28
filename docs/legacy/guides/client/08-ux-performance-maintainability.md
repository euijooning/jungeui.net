# UX·성능·유지보수 개선 (작업 결과)

플랜: [docs/plans/client/07-ux-performance-maintainability.md](../../plans/client/07-ux-performance-maintainability.md)

구현 완료 항목 요약.

---

## 1. CareerModal.jsx — Portal + 스크롤 잠금

**파일:** `apps/client/src/components/CareerModal.jsx`

- [x] `react-dom`에서 `createPortal` import, `useEffect`로 스크롤 잠금 (`open`일 때 `document.body.style.overflow = 'hidden'`, cleanup에서 복구).
- [x] `open`일 때만 `createPortal(모달 JSX, document.body)`로 렌더링해 body 직계 자식으로 배치.
- [x] 배경: `z-[9999]`, `bg-black/60`, `backdrop-blur-sm`. 배경 클릭 시 `onClose`, 내부 클릭 `stopPropagation`.
- [x] 모달 패널: `shadow-2xl` 적용.

---

## 2. SharedLayout.jsx — 검색창 URL 동기화

**파일:** `apps/client/src/components/SharedLayout.jsx`

- [x] `useRef`로 검색 input용 `searchInputRef` 추가.
- [x] `currentQ` 변경 시 `useEffect`에서 `searchInputRef.current.value = currentQ`로 input 값 동기화.
- [x] input에 `ref={searchInputRef}`, `defaultValue={currentQ}` 유지.
- [x] `key={currentQ || '_'}` 제거 (불필요한 리마운트·포커스 끊김 방지).

---

## 3. ProjectCard.jsx — 이미지 onError 무한 루프 방지

**파일:** `apps/client/src/components/ProjectCard.jsx`

- [x] 썸네일 img·intro_image img 모두 `onError`에서 이미 대체 URL이면 return 후 `src = '/favicon.png'` 설정.
- [x] 조건: `if (e.currentTarget.src.includes('/favicon.png')) return;`

---

## 4. About.jsx — API 병렬 처리 (Waterfall 제거)

**파일:** `apps/client/src/pages/About.jsx`

- [x] 5개 데이터 fetch를 하나의 `useEffect` 안에서 `Promise.all([ fetchAboutMessages(), fetchTags(...), fetchProjects(), fetchCareers(), fetchProjectsCareersIntro() ])`로 병렬 호출.
- [x] `let cancelled = false` 패턴 유지, `cancelled`일 때 setState 미호출.
- [x] 결과 검증 로직 유지: `Array.isArray`/`typeof introData === 'string'`, `sortCareersByPeriodDesc(careerData)`.
- [x] `document.title`용 useEffect, carousel/ResizeObserver용 useEffect는 그대로 유지.

---

## 5. Card.jsx — 키보드 접근성

**파일:** `apps/client/src/components/Card.jsx`

- [x] `onClick`이 있을 때만: `role="button"`, `tabIndex={0}`.
- [x] `onKeyDown`: `Enter` 또는 스페이스 시 `e.preventDefault()` 후 `onClick(e)` 호출.
- [x] `onClick`이 없으면 `role`/`tabIndex`/`onKeyDown`은 `undefined`.

---

## 6. PostDetail.jsx — GTM 태그 안전 처리

**파일:** `apps/client/src/pages/PostDetail.jsx`

- [x] GTM/데이터 레이어 도입 시 사용할 태그 문자열을 안전하게 생성:
  - `tagString = post.tags && Array.isArray(post.tags) ? post.tags.map(t => t.name).join(',') : ''`
- [x] 본문 `article`에 `data-tag-string={tagString || undefined}` 추가 (GTM 스크립트에서 활용 가능).

---

## 영향 범위 요약

| 파일 | 영향 |
|------|------|
| CareerModal | About 페이지 경력 모달; Portal·스크롤 잠금으로 견고해짐 |
| SharedLayout | 전체 레이아웃; 검색 사용 시 URL과 입력값 동기화 |
| ProjectCard | About 프로젝트 카드; 이미지 로드 실패 시 무한 루프 방지 |
| About | 데이터 로딩만 병렬화, UI/API 동일 |
| Card | Home 등 카드 목록; 클릭 유지 + 키보드(Enter/스페이스) 동작 |
| PostDetail | GTM 도입 시 `data-tag-string`·`tagString` 활용 |

**완료일:** 2026-02-17
