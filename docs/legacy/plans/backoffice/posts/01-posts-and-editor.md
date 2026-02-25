# 글 목록·글 쓰기(에디터)

## 참조

- [01-db-schema.md](../../../guides/common/01-db-schema.md): posts, categories, tags, post_tags, assets.
- [02-api-spec.md](../../../guides/common/02-api-spec.md): GET/POST/PUT/DELETE /posts, GET /categories, GET /tags, POST /assets/upload.

## 1. 글 목록 (PostList)

**파일**: `apps/backoffice/src/pages/posts/PostList.jsx`

- **API**: GET /api/posts (필터: category, tag, status). 페이지네이션·정렬.
- **UI**: 테이블 또는 카드 목록. 제목, 카테고리, 상태(DRAFT/PUBLISHED/PRIVATE/UNLISTED), 등록일, 발행일. [새 글 쓰기] → `/posts/new`, [보기] → `/posts/:postId`, [수정] → `/posts/:postId/edit`.
- **삭제**: DELETE /api/posts/{id} (확인 후).

## 2. 글 쓰기·상세 (PostEditor / PostNew / PostEdit / PostDetail)

**파일**: `apps/backoffice/src/pages/posts/PostEditor.jsx`(공통 에디터), `PostNew.jsx`, `PostEdit.jsx`, `PostDetail.jsx`

**레이아웃**: 좌측 에디터 / 우측 설정 패널.

### 에디터 (TinyMCE 로컬)

- **구성**: `@tinymce/tinymce-react` + `public/tinymce/` 로컬 배치. API 키·사용량 제한 없음.
- **툴바**: blocks, Bold, Italic, Forecolor, 정렬, 리스트, Table, Image, Media, Code 등.
- **이미지**: 툴바·드래그앤드롭·붙여넣기 → `images_upload_handler` → POST /api/assets/upload 후 URL 삽입.
- **미디어**: media 플러그인으로 YouTube 등 임베드.
- **저장**: content_html(뷰어용), content_json(null) API 전송.

### 우측 설정 패널

- **Status**: DRAFT / PUBLISHED / PRIVATE / UNLISTED (01-db-schema posts.status).
- **Publish Date**: 예약 발행용 날짜 (published_at).
- **URL Slug**: 제목 기반 자동 생성, 수정 가능 (posts.slug).
- **Category**: 라디오 또는 셀렉트. GET /api/categories 사용.
- **Tags**: 입력 후 엔터로 칩 추가. GET /api/tags 참고, 없으면 생성 또는 자동 완성.
- **Thumbnail**: 업로드 버튼 또는 "본문 첫 이미지 사용" 체크. thumbnail_asset_id 또는 별도 처리.

### API 연동

- **저장**: POST /api/posts (신규), PUT /api/posts/{id} (수정). category_id, thumbnail_asset_id, title, slug, excerpt, content_html, content_json, status, published_at, post_tags(태그 id 배열).
- **불러오기**: GET /api/posts/{id} (수정 시). content_json으로 에디터 복원.

## 완료 기준

- 글 목록에서 필터·페이지네이션·수정/삭제 동작.
- PostEditor에서 TinyMCE 에디터·설정 패널·이미지 업로드·미디어 임베드 동작.
- 저장 시 posts·post_tags 반영.

## 구현 현황

Phase 02 완료. 실제 라우트·파일은 `apps/backoffice/src/App.jsx` CustomRoutes 기준: `/posts`, `/posts/new`, `/posts/:postId`, `/posts/:postId/edit`. 포스트 상세(PostDetail)·첨부파일(다중 업로드·상세 목록·다운로드) 포함. 상세 구현은 [guides/backoffice/01-implementation-guide.md](../../../guides/backoffice/01-implementation-guide.md) 참고.

### 추가 적용 사항

- **대시보드 아이콘**: 사이드바 대시보드 메뉴 아이콘 Lucide `LayoutDashboard` 사용.
- **저장 후 이동**: 글 등록/수정 완료 시 **포스트 목록**(`/posts`)으로 리다이렉트 (대시보드 아님).
- **수정 시 발행일 유지**: 수정 저장 시 published_at을 **현재 시각으로 덮어쓰지 않음**. 기존 발행일 유지로 목록 순서 변경 없음. 예약 발행일 변경 시에만 published_at 갱신.
- **포스트 상세 UI**:
  - **브레드크럼**: "포스트 관리 / 상세 정보".
  - **시작점·끝점 통일**: 다른 페이지(PostList 등)와 동일한 좌우 범위 사용(`w-full`, 레이아웃 `p-6` 기준).
  - **2단 레이아웃**: 본문(3/4) + 메타 정보·첨부 파일 사이드바(1/4), 12열 grid 9:3 반응형. 제목·카테고리·상태는 본문 카드 상단에, 본문은 동일 카드 내부에만 표시.
  - **본문 스타일**: `admin-prose` 클래스로 가독성 적용(Public `.post-detail-prose`와 동일한 베스트 프랙티스). primary 색상(#35C5F0) 적용.
  - **삭제 확인**: "삭제된 데이터는 복구할 수 없습니다." 문구 포함.
  - **로딩**: 전역 `.loading-spinner` 사용; **에러**: 카드형 메시지 + "목록으로 돌아가기" 링크.
