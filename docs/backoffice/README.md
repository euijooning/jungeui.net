# Jungeui Lab 백오피스 구현 현황

관리자용 백오피스 구현 내용을 정리한 문서. 목표·상세 스펙은 [docs/common](../common/01-db-schema.md), [02-api-spec.md](../common/02-api-spec.md) 및 [plans/backoffice-make](../../plans/backoffice-make/00-backoffice-implementation-guide.md) 참고.

---

## 구현 완료 Phase

| Phase | 상태 | 내용 |
|-------|------|------|
| Phase 01 | 완료 | 레거시 제거, API·인증 연동, 대시보드 |
| Phase 02 | 완료 | 글 목록·글 쓰기(Toast UI 에디터·설정 패널)·상세·첨부파일 |
| Phase 03 | 미구현 | 경력·프로젝트 CRUD·드래그 정렬 |
| Phase 04 | 미구현 | 파일 보관함 갤러리·업로드·삭제 |

---

## Phase 01 요약

- **레거시 제거**: AdminLayout에서 은혜이음 전용 메뉴·경로·getPageTitle 제거. Jungeui 6개 메뉴만 유지(대시보드, 포스트 목록·새 포스트, 경력, 프로젝트, 파일 보관함).
- **API·인증**: authProvider(dataProvider)가 `VITE_API_URL + /api` 기준. POST /api/auth/login, JWT 저장. loadUserInfo는 /api/auth/me Jungeui 스펙 처리.
- **대시보드**: GET /api/dashboard/stats 연동(오늘/어제 방문자, 누적 조회수, 발행 포스트). Quick Action [새 글 쓰기] → /posts/new, [경력 추가] → /careers. Recent Activity(최근 글 5개 등) 영역.

---

## Phase 02 요약

### 포스트 목록 (PostList)

- **라우트**: `/posts`
- **API**: GET /api/posts — 필터(카테고리·태그·상태), 제목 검색(q), 정렬(최신 발행순/조회순/오래된 순), 페이지네이션.
- **UI**: 테이블 — 번호, 제목, 카테고리, 상태, 등록일, 발행일, 작업(보기/수정/삭제). [새 포스트], [삭제](선택 일괄). DELETE /api/posts/{id} 확인 후 실행.

### 포스트 상세 (PostDetail)

- **라우트**: `/posts/:postId`
- **UI**: 제목·부제, 정보 카드(카테고리·상태·등록일·발행일·태그), 본문(Toast UI 콘텐츠 스타일), **첨부 파일** 목록(링크 + 다운로드 버튼). 목록으로/수정하기/삭제하기.

### 포스트 에디터 (PostNew / PostEdit)

- **라우트**: `/posts/new`, `/posts/:postId/edit`
- **구성**: PostEditor 공통 — 좌측 **Toast UI Editor**, 우측 **설정 패널**.
- **에디터**: 마크다운·WYSIWYG, 툴바(제목·굵게·기울임·인용·코드·링크·이미지·유튜브·구분선). 이미지 업로드·유튜브 URL 붙여넣기 → POST /api/assets/upload 후 삽입.
- **설정 패널**: 상태(공개/일부공개/비공개/임시저장), 발행 방식(즉시/예약), 발행일, 카테고리(GET /api/categories), 태그(칩), 썸네일(업로드).
- **첨부 파일**: 다중 업로드(png, jpg, jpeg, pdf, ppt, pptx, hwp, hwpx, docx, 10MB 제한). 목록 표시·삭제. 저장 시 `attachment_asset_ids` 전송.
- **API**: POST /api/posts(신규), PUT /api/posts/{id}(수정), GET /api/posts/{id}(수정 시 로드). content_html, content_json, post_tags, attachment_asset_ids 반영.

### 첨부파일·다운로드

- **API**: GET /api/posts/{id} 응답에 `attachments: [{ id, original_name, url, size_bytes }]`. GET /api/assets/{asset_id}/download — Content-Disposition: attachment, 원본 파일명.
- **상세 화면**: 첨부 목록 항목별 링크(새 탭) + [다운로드] 버튼(인증 fetch 후 blob 저장).

---

## Phase 01-2 추가 기능

- **로그인 유지**: "로그인 유지" 체크 시 30일 세션(localStorage), 미체크 시 sessionStorage. authProvider·apiClient 연동.
- **시드 비밀번호 갱신**: `scripts/seed_data.py` 재실행 시 기존 관리자면 password_hash·name UPDATE.
- **브랜딩·메뉴**: JUNGEUI LAB(ADMIN 제거), "글" → "포스트" 통일.
- **사이드바 호버**: 메뉴 호버 시 배경색 없이 cursor-pointer만.
- **반응형**: tablet/desktop 브레이크포인트, 1279px 이하 오버레이 사이드바, 접힌 상태에서 포스트 단일 링크.
- **대시보드 통계**: 발행 포스트 카드, GET /api/dashboard/stats (today_visits, yesterday_visits, total_views, published_posts).

상세: [plans/backoffice-make/phase-01-2-implemented-features.md](../../plans/backoffice-make/phase-01-2-implemented-features.md)

---

## 기술 스택·주요 파일

- **스택**: React, React Admin, Tailwind CSS, Toast UI Editor. API: FastAPI(JWT).
- **페이지**: `apps/backoffice/src/pages/` — `dashboard/Dashboard.jsx`, `posts/PostList.jsx`, `PostDetail.jsx`, `PostNew.jsx`, `PostEdit.jsx`, `PostEditor.jsx`, `careers/CareerList.jsx`, `projects/ProjectList.jsx`, `assets/AssetList.jsx`.
- **라우트** (App.jsx CustomRoutes): `/`(대시보드), `/posts`, `/posts/new`, `/posts/:postId/edit`, `/posts/:postId`, `/careers`, `/projects`, `/assets`.

---

## 참고 문서

- [00-backoffice-implementation-guide.md](../../plans/backoffice-make/00-backoffice-implementation-guide.md) — 구현 순서·DB↔API 대응
- [backoffice-phase-checklist.md](../../plans/backoffice-make/backoffice-phase-checklist.md) — Phase별 체크리스트
- [phase-02-posts-and-editor.md](../../plans/backoffice-make/phase-02-posts-and-editor.md) — 글 목록·에디터 스펙
- [docs/common/01-db-schema.md](../common/01-db-schema.md), [02-api-spec.md](../common/02-api-spec.md), [04-design-guide.md](../common/04-design-guide.md)
