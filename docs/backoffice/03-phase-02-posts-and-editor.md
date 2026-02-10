# Phase 02: 글 목록·글 쓰기(에디터)

## 참조

- [../common/01-db-schema.md](../common/01-db-schema.md): posts, categories, tags, post_tags, assets.
- [../common/02-api-spec.md](../common/02-api-spec.md): GET/POST/PUT/DELETE /posts, GET /categories, GET /tags, POST /assets/upload.

---

## 1. 글 목록 (PostList)

**파일**: `apps/backoffice/src/pages/posts/PostList.jsx`

- **API**: GET /api/posts (필터: category, tag, status). 페이지네이션·정렬.
- **UI**: 테이블 — 번호, 제목, 카테고리, 상태(DRAFT/PUBLISHED/PRIVATE/UNLISTED), 등록일, 발행일, 작업(보기/수정/삭제). [새 포스트], 일괄 [삭제]. DELETE /api/posts/{id} 확인 후.
- **라우트**: `/posts`

## 2. 포스트 상세 (PostDetail)

**파일**: `apps/backoffice/src/pages/posts/PostDetail.jsx`

- **라우트**: `/posts/:postId`
- **UI**: 제목·부제, 정보 카드(카테고리·상태·등록일·발행일·태그), 본문(Toast UI 콘텐츠 스타일), **첨부 파일** 목록(링크 + 다운로드 버튼). 목록으로/수정하기/삭제하기.
- **첨부파일**: GET /api/posts/{id} 응답에 `attachments: [{ id, original_name, url, size_bytes }]`. GET /api/assets/{asset_id}/download — Content-Disposition: attachment, 원본 파일명.

## 3. 포스트 에디터 (PostNew / PostEdit)

**파일**: `PostEditor.jsx`(공통), `PostNew.jsx`, `PostEdit.jsx`

**레이아웃**: 좌측 에디터 / 우측 설정 패널.

### 에디터 (Toast UI Editor)

- **툴바**: H1~H3, Bold, Italic, Strike, Blockquote, Code Block, Link, Image, YouTube Embed, Horizontal Rule.
- **이미지**: 툴바·드래그앤드롭·Ctrl+V → POST /api/assets/upload 후 URL 삽입.
- **유튜브**: URL 붙여넣기 시 플레이어 노드로 변환.
- **저장**: content_html(뷰어용), content_json(에디터 복구용) 둘 다 API 전송.

### 우측 설정 패널

- **Status**: DRAFT / PUBLISHED / PRIVATE / UNLISTED.
- **Publish Date**: 예약 발행용 (published_at).
- **URL Slug**: 제목 기반 자동 생성, 수정 가능.
- **Category**: GET /api/categories.
- **Tags**: 입력 후 엔터로 칩 추가.
- **Thumbnail**: 업로드 또는 본문 첫 이미지 사용.
- **첨부 파일**: 다중 업로드(png, jpg, jpeg, pdf, ppt, pptx, hwp, hwpx, docx, 10MB 제한). 목록 표시·삭제. 저장 시 `attachment_asset_ids` 전송.

### API 연동

- **저장**: POST /api/posts (신규), PUT /api/posts/{id} (수정). category_id, thumbnail_asset_id, title, slug, excerpt, content_html, content_json, status, published_at, post_tags, attachment_asset_ids.
- **불러오기**: GET /api/posts/{id} (수정 시 content_json 복원).

**라우트**: `/posts/new`, `/posts/:postId/edit`

## 4. 추가 적용 사항

- **대시보드 아이콘**: 사이드바 대시보드 메뉴 아이콘 `fa-th` 사용.
- **저장 후 이동**: 글 등록/수정 완료 시 **포스트 목록**(`/posts`)으로 리다이렉트.
- **수정 시 발행일 유지**: 수정 저장 시 `published_at` 덮어쓰지 않음. 예약 발행일 변경 시에만 갱신.
- **포스트 상세**: 제목 상단 한 번만. "본문" 라벨은 카드 밖 상단, 본문 내용만 카드 안에 렌더링.

## 완료 기준

- 글 목록에서 필터·페이지네이션·수정/삭제 동작.
- PostEditor에서 Toast UI 에디터·설정 패널·이미지 업로드·유튜브 임베드 동작.
- 저장 시 posts·post_tags·attachment_asset_ids 반영.
