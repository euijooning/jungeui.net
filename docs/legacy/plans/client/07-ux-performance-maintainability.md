# 07. UX·성능·유지보수 개선

기능 완성도는 높으나 UX 디테일, 성능 최적화, 유지보수성 측면에서 적용할 개선 사항을 정리한 플랜.

참조: 클라이언트 구현 가이드, 공통 레이아웃·SEO·푸터 가이드.

---

## 적용 순서

| 순서 | 파일 | 개선 내용 |
| --- | --- | --- |
| 1 | CareerModal.jsx | Portal + 스크롤 잠금 |
| 2 | SharedLayout.jsx | 검색창 URL 동기화 |
| 3 | ProjectCard.jsx | 이미지 onError 무한 루프 방지 |
| 4 | About.jsx | API 병렬 처리 (Waterfall 제거) |
| 5 | Card.jsx | 키보드 접근성 |
| 6 | PostDetail.jsx | GTM용 tagString 안전 처리 |

---

## 1. CareerModal.jsx — Portal + 스크롤 잠금

**문제:** 모달이 컴포넌트 트리 안에서 렌더링되며 `z-[1000]` 사용. 상위에 `overflow: hidden`/`transform`/`z-index`가 있으면 잘리거나 뒤로 가려질 수 있음. 스크롤 잠금 없음.

**변경:**
- `react-dom`에서 `createPortal` import.
- `open`일 때만 `createPortal(모달 JSX, document.body)`로 렌더링.
- `useEffect`로 `open`일 때 `document.body.style.overflow = 'hidden'`, 닫을 때/언마운트 시 `''` 복구.
- 배경: `z-[9999]`, `backdrop-blur-sm` 등. 배경 클릭 시 `onClose`, 내부 클릭은 `stopPropagation`.

---

## 2. SharedLayout.jsx — 검색창 URL 동기화

**문제:** 검색 input에 `defaultValue={currentQ}`와 `key={currentQ || '_'}` 사용. 뒤로가기/URL 직접 변경 시 input이 URL의 `q`와 어긋날 수 있고, `key` 변경으로 포커스 끊김.

**변경:**
- `useRef`로 검색 input용 ref 추가.
- `currentQ` 변경 시 input 값을 반영하는 `useEffect` 추가 (`searchInputRef.current.value = currentQ`).
- input에 `ref` 연결, `defaultValue={currentQ}` 유지.
- `key={currentQ || '_'}` 제거.

---

## 3. ProjectCard.jsx — 이미지 onError 무한 루프 방지

**문제:** `onError`에서 `e.currentTarget.src = '/favicon.png'`만 설정. `/favicon.png`도 실패하면 onError가 반복 호출될 수 있음.

**변경:**
- `onError` 내부에서 이미 대체 URL이면 return: `if (e.currentTarget.src.includes('/favicon.png')) return;`
- 썸네일용 img와 intro_image용 img 둘 다 동일 로직 적용.

---

## 4. About.jsx — API 병렬 처리 (Waterfall 제거)

**문제:** 5개 fetch를 각각 별도 `useEffect`에서 호출. 순차/중복 리렌더 가능성.

**변경:**
- 5개 fetch를 하나의 `useEffect` 안에서 `Promise.all([...])`로 병렬 호출.
- `let cancelled = false` 패턴 유지.
- 기존 5개 데이터용 `useEffect` 제거. `document.title`·`carouselRef`/ResizeObserver용 useEffect는 유지.

---

## 5. Card.jsx — 키보드 접근성

**문제:** `article`에 `onClick`만 있어 포커스 불가·키보드 활성화 불가.

**변경:**
- `onClick`이 있을 때만: `role="button"`, `tabIndex={0}`, `onKeyDown`에서 Enter/스페이스 시 `onClick(e)` 호출.
- `onClick`이 없으면 해당 속성들은 undefined.

---

## 6. PostDetail.jsx — GTM 태그 안전 처리

**제안:** GTM/데이터 레이어 도입 시 태그 문자열을 안전하게 생성.

```js
const tagString = post.tags && Array.isArray(post.tags)
  ? post.tags.map(t => t.name).join(',')
  : '';
```

GTM 이벤트 추가 시 위 변수 사용.

---

## 영향 범위

- **CareerModal**: About 페이지. Portal·스크롤 잠금으로 견고해짐.
- **SharedLayout**: 전체 레이아웃. 검색 사용 시에만 영향.
- **ProjectCard**: About 프로젝트 카드. 에러 시에만 동작 차이.
- **About**: 데이터 로딩 경로만 변경, UI/API 동일.
- **Card**: Home 등 카드 목록. 클릭 유지 + 키보드 동작 추가.
- **PostDetail**: GTM 도입 시 tagString 사용.
