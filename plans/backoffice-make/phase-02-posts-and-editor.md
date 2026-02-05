# Phase 02: 글 목록·글 쓰기(에디터)

## 참조

- [docs/01-db-schema.md](../docs/01-db-schema.md): posts, categories, tags, post_tags, assets.
- [docs/02-api-spec.md](../docs/02-api-spec.md): GET/POST/PUT/DELETE /posts, GET /categories, GET /tags, POST /assets/upload.

## 1. 글 목록 (PostList)

**파일**: `apps/backoffice/src/pages/posts/PostList.jsx`

- **API**: GET /api/posts (필터: category, tag, status). 페이지네이션·정렬.
- **UI**: 테이블 또는 카드 목록. 제목, 카테고리, 상태(DRAFT/PUBLISHED/PRIVATE), 발행일, 수정일. [새 글 쓰기] → `/posts/new`, [보기] → `/posts/:postId`, [수정] → `/posts/:postId/edit`.
- **삭제**: DELETE /api/posts/{id} (확인 후).

## 2. 글 쓰기·상세 (PostEditor / PostNew / PostEdit / PostDetail)

**파일**: `apps/backoffice/src/pages/posts/PostEditor.jsx`(공통 에디터), `PostNew.jsx`, `PostEdit.jsx`, `PostDetail.jsx`

**레이아웃**: 좌측 에디터 / 우측 설정 패널.

### 에디터 (Toast UI Editor)

- **툴바**: H1~H3, Bold, Italic, Strike, Blockquote, Code Block, Link, Image, YouTube Embed, Horizontal Rule.
- **이미지**: 툴바 버튼·드래그앤드롭·Ctrl+V → POST /api/assets/upload 호출 후 이미지 URL로 삽입.
- **유튜브**: URL 붙여넣기 시 플레이어 노드로 변환.
- **저장**: content_html(뷰어용), content_json(에디터 복구용) 둘 다 API로 전송.

### 우측 설정 패널

- **Status**: DRAFT / PUBLISHED / PRIVATE (01-db-schema posts.status).
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
- PostEditor에서 Toast UI 에디터·설정 패널·이미지 업로드·유튜브 임베드 동작.
- 저장 시 posts·post_tags 반영.

## 구현 현황

Phase 02 완료. 실제 라우트·파일은 `apps/backoffice/src/App.jsx` CustomRoutes 기준: `/posts`, `/posts/new`, `/posts/:postId`, `/posts/:postId/edit`. 포스트 상세(PostDetail)·첨부파일(다중 업로드·상세 목록·다운로드) 포함. 상세 구현은 [docs/backoffice/README.md](../../docs/backoffice/README.md) 참고.

### 추가 적용 사항

- **대시보드 아이콘**: 사이드바 대시보드 메뉴 아이콘 `fa-th`(네모 4개 그리드) 사용.
- **저장 후 이동**: 글 등록/수정 완료 시 **포스트 목록**(`/posts`)으로 리다이렉트 (대시보드 아님).
- **수정 시 발행일 유지**: 수정 저장 시 `published_at`을 **현재 시각으로 덮어쓰지 않음**. 기존 발행일 유지로 목록 순서 변경 없음. 예약 발행일 변경 시에만 `published_at` 갱신.
- **포스트 상세**: 제목은 상단에 한 번만 표시. **본문** 라벨은 컨테이너(흰 카드) **밖** 상단에 표시 후, 본문 내용만 카드 안에 렌더링.
