# Phase 04: 소개 페이지 (About)

구현 후 해당 항목을 체크. **Phase 완료 시 "완료 점검" 항목을 실행하고 보고.**

참조: [01-implementation-guide.md](01-implementation-guide.md), [../common/02-api-spec.md](../common/02-api-spec.md), [sungbin.dev/about](https://sungbin.dev/about/)

---

## 경로 및 구성 순서 (고정)

- [x] **1** 경로: `/about`.
- [x] **2** 구성 순서: **인사말** → **태그** → **프로젝트(Grid Card)**.

---

## 4-1. 인사말

- [x] **3** 인사말·자기소개 영역 (API 메시지 연동).

### 4-1-1. 백오피스·API (인사말 메시지)

- **백오피스 메뉴**: 소개 관리 아코디언 하위 — 메시지(`/messages`), 경력(`/careers`), 프로젝트(`/projects`).
- **DB**: `about_messages` (title, content, sort_order). [../common/01-db-schema.md](../common/01-db-schema.md) 참고.
- **API**: GET /api/about/messages (공개). GET/POST/PUT/DELETE /api/about_messages (Admin).
- **클라이언트**: GET /api/about/messages로 제목·내용 fetch → 하늘색 소제목 + 본문, 최대 3개. 제목·점·메시지 그리드·이메일 버튼(mailto).

**완료 점검**: 백오피스 소개 메뉴에서 메시지/경력/프로젝트 접근 가능. 메시지 CRUD 동작. /about에서 인사말(제목, 점, 메시지 3개, 이메일) 표시. GET /api/about/messages 공개 조회 동작. (점검일: 2025-02-10)

---

## 4-2. 태그

- [x] **4** 태그 섹션: 인사말 아래 흰색 배경 분리 영역. "태그" h1, chip 형태 태그 버튼, flex-wrap. 태그 소스: post_tags, GET /tags (used_in_posts=true 시 post_count). 태그 클릭 시 `/?tag={tag_id}` 또는 `/posts?tag={tag_id}` 이동. Home에서 tag 쿼리 파라미터로 fetchPosts({ tag_id }). (점검일: 2025-02-07)

---

## 4-3. 프로젝트(Project)

- [x] **5** GET /projects (및 project_links, project_tags 필요 시 API 확장).
- [x] **6** **글 목록 카드와 동일한 카드 컴포넌트** 사용.
- [x] **7** 카드 클릭 시 **Accordion** 또는 **상세 토글**.
- [x] **8** 프로젝트별 링크(project_links), 태그(project_tags) 노출.
- [x] **9** 프로젝트 옆에 **경력 버튼** 배치. 클릭 시 **모달**로 경력(타임라인) 표시.

### 프로젝트 섹션 상세 (카로셀)

- **위치**: 태그 섹션 아래 **하늘색 배경** 컨테이너. 다크모드: `dark:bg-(--ui-background)`.
- **형태**: 카로셀 (3개 풀 노출, 좌/우 화살표, 하단 인디케이터, 그라데이션 페이드). 가운데 정렬(paddingLeft), 카드 크기 0.95, mask-image 페이드. [07-project-card-layout.md](07-project-card-layout.md) 참고.
- **ProjectCard**: 대표이미지(w-14 h-14), 프로젝트명(최대 25자, line-clamp-2), 기간+링크(최대 5), 태그(최대 6), 설명(최대 100자 3줄), 상세이미지(intro_image). px-5 py-4, shadow-lg.
- **Phase 완료** (점검일: 2025-02-07)

---

## 4-4. 경력(Career) — 모달

- [x] **10** GET /careers, sort_order 순 목록.
- [x] **11** 경력 버튼 클릭 시 모달에 세로 타임라인 형식으로 표시.
- [x] **12** 항목: 기간, 회사 이미지(선택), 회사명, 역할, 링크, 한 일(최대 5), 태그(최대 5).

### 경력 모달 상세 (CareerModal)

- **위치**: `/about` 페이지, 프로젝트 옆 **경력** 버튼 클릭 시 모달.
- **형태**: 모달 확대(max-w-2xl 또는 max-w-3xl, max-h-[85vh]) + **세로 타임라인**(선 + 원형 마커) + **카드 컨테이너** per 경력.
- **카드 내 항목**: 기간(yyyy.mm ~ yyyy.mm 또는 (현재)), logo_asset_id(작은 정사각형 w-12 h-12), 회사명, 역할, 링크(웹사이트/깃허브/유튜브/인스타그램/기타, 최대 5), 한 일(career_highlights, 최대 5), 태그(career_tags, pill, 최대 5).
- **스타일**: 타임라인 선·원형 마커·기간 뱃지·태그 pill — 하늘색·파란색 계열. [../common/06-ui-ux-guide.md](../common/06-ui-ux-guide.md) 참고.
- **API**: GET /careers에 logo(URL), career_links, career_highlights, career_tags 포함. POST/PUT에 career_links, career_highlights, career_tags 포함.
- **Phase 완료** (점검일: 2025-02-10)

---

## Phase 04 완료 점검 (구현 후 실행 후 보고)

- [x] **13** `/about` 접속 시 인사말·태그·프로젝트(그리드) 표시.
- [x] **14** 프로젝트 옆 경력 버튼 클릭 시 모달에 경력 타임라인 표시.
- [x] **15** 경력·프로젝트 데이터가 API 연동으로 노출됨.

**Phase 04 완료** (점검일: 2025-02-10)
