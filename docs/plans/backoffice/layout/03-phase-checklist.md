# 백오피스 Phase별 체크리스트

구현 후 해당 항목을 체크. **한 Phase 끝날 때마다 해당 Phase의 "완료 점검" 항목을 실행하고 보고.**

참조: [../00-backoffice-implementation-guide.md](../00-backoffice-implementation-guide.md), [02-api-spec.md](../../../guides/common/02-api-spec.md)

---

## Phase 01: 레거시 제거·API 연동·대시보드

**파일**: `AdminLayout.jsx`, `Dashboard.jsx`, `authProvider.js`, `dataProvider.js`, `apiClient.js`

- [x] **1** navSections: 회원/콘텐츠/교회소개/교적/설정/가족모임 관리 제거. Jungeui 5개만 유지 (대시보드, 글 관리, 글 쓰기, 경력, 프로젝트).
- [x] **2** 아코디언 state 및 관련 useEffect 제거 (contentAccordionOpen, usersAccordionOpen, churchAccordionOpen, membershipAccordionOpen, settingsAccordionOpen).
- [x] **3** getPageTitle: 레거시 specialCases 전부 제거. `/`, `/posts`, `/posts/new`, `/posts/:postId/edit`, `/careers`, `/projects`, `/notifications` 매핑.
- [x] **4** loadUserInfo: `/api/auth/me` 응답을 Jungeui 스펙에 맞게 처리 (nickname → name 등).
- [x] **5** authProvider: POST /api/auth/login, JWT 저장이 02-api-spec과 일치하는지 확인.
- [x] **6** dataProvider: apiUrl = VITE_API_URL + `/api`, 리소스 경로(posts, categories, tags, careers, projects, assets) 스펙 일치 확인.
- [x] **7** apiClient: VITE_API_URL 사용 확인.
- [x] **8** 대시보드: GET /api/dashboard/stats 연동 (오늘 방문자, 누적 조회수, 발행 포스트). daily_stats는 퍼블릭 조회 시 자동 갱신.
- [x] **9** 대시보드: 바로가기 — 포스트 목록, 경력 관리, 프로젝트 관리.
- [x] **10** 대시보드: 최근 활동 — GET /api/dashboard/recent-activity, 클릭 시 상세 이동.

### Phase 01 완료 점검

- [x] **11** AdminLayout에 은혜이음 전용 메뉴·경로·getPageTitle 없음.
- [x] **12** 대시보드에서 통계 API 호출 또는 연동 가능한 구조.
- [x] **13** 로그인·dataProvider가 02-api-spec 기준으로 동작.

**Phase 01 완료** (점검일: 2025-02-05)

---

## Phase 02: 글 목록·글 쓰기(에디터)

**파일**: `PostList.jsx`, `PostEditor.jsx`, `PostNew.jsx`, `PostEdit.jsx`, `PostDetail.jsx`

- [x] **14** PostList: GET /api/posts (필터 category, tag, status), 페이지네이션·정렬.
- [x] **15** PostList: 테이블/카드에 제목, 카테고리, 상태(DRAFT/PUBLISHED/PRIVATE/UNLISTED), 등록일, 발행일 표시.
- [x] **16** PostList: [새 글 쓰기] → `/posts/new`, 행 클릭 또는 [수정] → `/posts/{postId}/edit`.
- [x] **17** PostList: DELETE /api/posts/{id} (확인 후).
- [x] **18** PostEditor: 좌측 에디터 / 우측 설정 패널 레이아웃.
- [x] **19** PostEditor: Toast UI 에디터 툴바 (H1~H3, Bold, Italic, Strike, Blockquote, Code Block, Link, Image, YouTube Embed, Horizontal Rule).
- [x] **20** PostEditor: 이미지 — 툴바·드래그앤드롭·Ctrl+V → POST /api/assets/upload 후 URL 삽입.
- [x] **21** PostEditor: 유튜브 URL 붙여넣기 시 플레이어 노드로 변환.
- [x] **22** PostEditor: 저장 시 content_html, content_json 둘 다 API 전송.
- [x] **23** PostEditor: 설정 패널 — Status, Publish Date, URL Slug, Category(GET /api/categories), Tags(칩), Thumbnail.
- [x] **24** PostEditor: POST /api/posts(신규), PUT /api/posts/{id}(수정), GET /api/posts/{id}(수정 시 content_json 복원). 라우트: `/posts/new`, `/posts/:postId/edit`.

### Phase 02 완료 점검

- [x] **25** 글 목록에서 필터·페이지네이션·수정/삭제 동작.
- [x] **26** PostEditor에서 Toast UI 에디터·설정 패널·이미지 업로드·유튜브 임베드 동작.
- [x] **27** 저장 시 posts·post_tags 반영.

**Phase 02 완료** (점검일: 2026-02-05)

---

## Phase 03: 경력·프로젝트 관리

**파일**: `CareersList.jsx`, `ProjectsList.jsx`

- [x] **28** CareersList: GET /api/careers, sort_order 순 목록.
- [x] **29** CareersList: 드래그앤드롭 순서 변경 → PATCH /api/careers/reorder.
- [x] **30** CareersList: 등록/수정 폼 — company_name, role, start_date, end_date(NULL=재직중), description, logo_asset_id(POST /api/assets/upload), sort_order.
- [x] **31** CareersList: POST /api/careers, PUT /api/careers/{id}.
- [x] **32** ProjectsList: GET /api/projects, sort_order 순 목록.
- [x] **33** ProjectsList: 드래그앤드롭 → PATCH /api/projects/reorder.
- [x] **34** ProjectsList: 등록/수정 폼 — title, description, start_date, end_date, sort_order, thumbnail_asset_id, intro_image_asset_id.
- [x] **35** ProjectsList: project_links(link_name, link_url 다중, sort_order).
- [x] **36** ProjectsList: project_tags — Enter로 추가, 최대 6개.
- [x] **37** ProjectsList: POST/PUT /api/projects (project_links·project_tags 포함).

### Phase 03 완료 점검

- [x] **38** 경력 목록·드래그 정렬·등록/수정(로고 업로드 포함) 동작.
- [x] **39** 프로젝트 목록·드래그 정렬·등록/수정(썸네일·링크 여러 개·태그) 동작.

---

## Phase 04: 파일 보관함 — 제거됨

별도 파일 보관함 페이지·메뉴 없음. 업로드는 포스트/경력/프로젝트 편집 화면에서 POST /api/assets/upload 인라인 사용.

---

## 요약

| Phase   | 구현 항목 | 완료 점검 항목 |
|---------|-----------|----------------|
| Phase 01 | 1~10      | 11~13          |
| Phase 02 | 14~24     | 25~27          |
| Phase 03 | 28~37     | 38~39          |

**한 Phase 끝나면 해당 Phase의 완료 점검 항목을 체크하고 보고.**
