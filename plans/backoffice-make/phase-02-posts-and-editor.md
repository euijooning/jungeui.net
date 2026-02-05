# Phase 02: 글 목록·글 쓰기(에디터)

## 참조

- [docs/01-db-schema.md](../docs/01-db-schema.md): posts, categories, tags, post_tags, assets.
- [docs/02-api-spec.md](../docs/02-api-spec.md): GET/POST/PUT/DELETE /posts, GET /categories, GET /tags, POST /assets/upload.

## 1. 글 목록 (PostsList)

**파일**: `apps/backoffice/src/pages/PostsList.jsx`

- **API**: GET /api/posts (필터: category, tag, status). 페이지네이션·정렬.
- **UI**: 테이블 또는 카드 목록. 제목, 카테고리, 상태(DRAFT/PUBLISHED/PRIVATE), 발행일, 수정일. [새 글 쓰기] → `/write`, 행 클릭 또는 [수정] → `/write/:id`.
- **삭제**: DELETE /api/posts/{id} (확인 후).

## 2. 글 쓰기 (Write)

**파일**: `apps/backoffice/src/pages/Write.jsx` (및 필요한 하위 컴포넌트)

**레이아웃**: 좌측 에디터 / 우측 설정 패널.

### 에디터 (TipTap)

- **툴바**: H1~H3, Bold, Italic, Strike, Blockquote, Code Block, Link, Image, YouTube Embed, Horizontal Rule.
- **이미지**: 툴바 버튼·드래그앤드롭·Ctrl+V → POST /api/assets/upload 호출 후 이미지 URL로 삽입.
- **유튜브**: URL 붙여넣기 시 플레이어 노드로 변환.
- **저장**: content_html(뷰어용), content_json(TipTap 복구용) 둘 다 API로 전송.

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
- Write에서 TipTap 에디터·설정 패널·이미지 업로드·유튜브 임베드 동작.
- 저장 시 posts·post_tags 반영.
