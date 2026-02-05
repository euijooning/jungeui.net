# 백오피스 Phase별 체크리스트

구현 후 해당 항목을 체크. **한 Phase 끝날 때마다 해당 Phase의 "완료 점검" 항목을 실행하고 보고.**

참조: [00-backoffice-implementation-guide.md](00-backoffice-implementation-guide.md), [docs/02-api-spec.md](../docs/02-api-spec.md)

---

## Phase 01: 레거시 제거·API 연동·대시보드

**파일**: `AdminLayout.jsx`, `Dashboard.jsx`, `authProvider.js`, `dataProvider.js`, `apiClient.js`

- [x] **1** navSections: 회원/콘텐츠/교회소개/교적/설정/가족모임 관리 제거. Jungeui 6개만 유지 (대시보드, 글 관리, 글 쓰기, 경력, 프로젝트, 파일 보관함).
- [x] **2** 아코디언 state 및 관련 useEffect 제거 (contentAccordionOpen, usersAccordionOpen, churchAccordionOpen, membershipAccordionOpen, settingsAccordionOpen).
- [x] **3** getPageTitle: 레거시 specialCases 전부 제거. `/`, `/posts`, `/posts/new`, `/posts/:postId/edit`, `/careers`, `/projects`, `/assets` 만 매핑.
- [x] **4** loadUserInfo: `/api/auth/me` 응답을 Jungeui 스펙에 맞게 처리 (nickname → name 등).
- [x] **5** authProvider: POST /api/auth/login, JWT 저장이 02-api-spec과 일치하는지 확인.
- [x] **6** dataProvider: apiUrl = VITE_API_URL + `/api`, 리소스 경로(posts, categories, tags, careers, projects, assets) 스펙 일치 확인.
- [x] **7** apiClient: VITE_API_URL 사용 확인.
- [x] **8** 대시보드: GET /api/dashboard/stats 연동 (오늘/어제 방문자, 누적 조회수). 미구현 시 플레이스홀더.
- [x] **9** 대시보드: Quick Action [새 글 쓰기] → `/posts/new`, [경력 추가] → `/careers`.
- [x] **10** 대시보드: Recent Activity 영역 (최근 글 5개 등, API 준비 시 연동).

### Phase 01 완료 점검 (구현 후 실행 후 보고)

- [x] **11** AdminLayout에 은혜이음 전용 메뉴·경로·getPageTitle 없음.
- [x] **12** 대시보드에서 통계 API 호출 또는 연동 가능한 구조.
- [x] **13** 로그인·dataProvider가 02-api-spec 기준으로 동작.

**Phase 01 완료** (점검일: 2025-02-05)

---

## Phase 02: 글 목록·글 쓰기(에디터)

**파일**: `PostsList.jsx`, `Write.jsx`

- [ ] **14** PostsList: GET /api/posts (필터 category, tag, status), 페이지네이션·정렬.
- [ ] **15** PostsList: 테이블/카드에 제목, 카테고리, 상태(DRAFT/PUBLISHED/PRIVATE), 발행일, 수정일 표시.
- [ ] **16** PostsList: [새 글 쓰기] → `/posts/new`, 행 클릭 또는 [수정] → `/posts/{postId}/edit`.
- [ ] **17** PostsList: DELETE /api/posts/{id} (확인 후).
- [ ] **18** Write: 좌측 에디터 / 우측 설정 패널 레이아웃.
- [ ] **19** Write: TipTap 툴바 (H1~H3, Bold, Italic, Strike, Blockquote, Code Block, Link, Image, YouTube Embed, Horizontal Rule).
- [ ] **20** Write: 이미지 — 툴바·드래그앤드롭·Ctrl+V → POST /api/assets/upload 후 URL 삽입.
- [ ] **21** Write: 유튜브 URL 붙여넣기 시 플레이어 노드로 변환.
- [ ] **22** Write: 저장 시 content_html, content_json 둘 다 API 전송.
- [ ] **23** Write: 설정 패널 — Status, Publish Date, URL Slug, Category(GET /api/categories), Tags(칩), Thumbnail.
- [ ] **24** Write: POST /api/posts(신규), PUT /api/posts/{id}(수정), GET /api/posts/{id}(수정 시 content_json 복원). 라우트: `/posts/new`, `/posts/:postId/edit`.

### Phase 02 완료 점검 (구현 후 실행 후 보고)

- [ ] **25** 글 목록에서 필터·페이지네이션·수정/삭제 동작.
- [ ] **26** Write에서 TipTap 에디터·설정 패널·이미지 업로드·유튜브 임베드 동작.
- [ ] **27** 저장 시 posts·post_tags 반영.

---

## Phase 03: 경력·프로젝트 관리

**파일**: `CareersList.jsx`, `ProjectsList.jsx`

- [ ] **28** CareersList: GET /api/careers, sort_order 순 목록.
- [ ] **29** CareersList: 드래그앤드롭 순서 변경 → PATCH /api/careers/reorder.
- [ ] **30** CareersList: 등록/수정 폼 — company_name, role, start_date, end_date(NULL=재직중), description, logo_asset_id(POST /api/assets/upload), sort_order.
- [ ] **31** CareersList: POST /api/careers, PUT /api/careers/{id}.
- [ ] **32** ProjectsList: GET /api/projects, sort_order 순 목록.
- [ ] **33** ProjectsList: 드래그앤드롭 → PATCH /api/projects/reorder.
- [ ] **34** ProjectsList: 등록/수정 폼 — title, subtitle, description, start_date, end_date, sort_order, thumbnail_asset_id.
- [ ] **35** ProjectsList: project_links(link_name, link_url 다중, sort_order).
- [ ] **36** ProjectsList: project_tags — GET /api/tags 다중 선택.
- [ ] **37** ProjectsList: POST/PUT /api/projects (project_links·project_tags 포함).

### Phase 03 완료 점검 (구현 후 실행 후 보고)

- [ ] **38** 경력 목록·드래그 정렬·등록/수정(로고 업로드 포함) 동작.
- [ ] **39** 프로젝트 목록·드래그 정렬·등록/수정(썸네일·링크 여러 개·태그) 동작.

---

## Phase 04: 파일 보관함 (Assets)

**파일**: `AssetsList.jsx`, Write/Careers/Projects 내 업로드 연동

- [ ] **40** AssetsList: GET /api/assets, 갤러리 그리드 뷰.
- [ ] **41** AssetsList: 썸네일(또는 아이콘), original_name, size_bytes, uploaded_at 표시.
- [ ] **42** AssetsList: URL 복사 — 공개 URL 클립보드 복사.
- [ ] **43** AssetsList: DELETE /api/assets/{id} (사용 여부 체크/경고 반영).
- [ ] **44** Write/Careers/Projects에서 이미지·로고·썸네일 업로드 시 POST /api/assets/upload 사용, 응답 asset id 저장.

### Phase 04 완료 점검 (구현 후 실행 후 보고)

- [ ] **45** 파일 보관함 갤러리·URL 복사·삭제 동작.
- [ ] **46** 글 쓰기/경력/프로젝트 화면에서 업로드 후 자산 목록과 연동.

---

## 요약

| Phase   | 구현 항목 | 완료 점검 항목 |
|---------|-----------|----------------|
| Phase 01 | 1~10      | 11~13          |
| Phase 02 | 14~24     | 25~27          |
| Phase 03 | 28~37     | 38~39          |
| Phase 04 | 40~44     | 45~46          |

**한 Phase 끝나면 해당 Phase의 완료 점검 항목을 체크하고 보고.**
