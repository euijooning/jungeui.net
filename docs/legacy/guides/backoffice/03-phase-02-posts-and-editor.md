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

- **대시보드 아이콘**: AdminLayout 사이드바 대시보드 메뉴 아이콘 Lucide `LayoutDashboard` 사용.
- **저장 후 이동**: 글 등록/수정 완료 시 **포스트 목록**(`/posts`)으로 리다이렉트.
- **포스트 상세**: 제목 상단 한 번만. "본문" 라벨은 카드 밖 상단, 본문 내용만 카드 안에 렌더링.
- **본문 제목 h5/h6 (WYSIWYG)**: 에디터(PostEditor content_style)·미리보기(PostDetail admin-prose)에서도 h1~h6 스타일이 Client 글 상세와 동일하게 적용됨. h5/h6가 본문보다 작아지지 않도록 크기·색상 지정.

## 5. 발행일(published_at) 처리

수정 저장 시 기존 발행일이 덮어쓰이지 않도록 하고, 비공개 전환 시에도 날짜가 DB에서 사라지지 않도록 한다.

### 5.1 프론트엔드 (PostEditor.jsx)

- **originPublishedAt**: 로드 시(GET /api/posts/{id}) 서버에서 받은 `published_at`을 그대로 저장해 둔다. 폼에서 사용자가 날짜를 바꿔도 "원본 발행일" 비교·복구용으로 사용.
- **로드 시**: `toLocalISOString(d.published_at)`으로 datetime-local용 문자열(`YYYY-MM-DDTHH:mm`)을 만들어 `form.published_at`에 넣는다. 이때 `.slice(0, 16)` 때문에 초 단위는 잘린다.
- **저장 시(handleSave)**  
  - **공개 + 예약 발행**: `form.published_at`(사용자 입력 미래 날짜)를 UTC ISO로 전송.  
  - **공개 + 즉시 공개**: `originPublishedAt` 기준. 원본이 있고 과거면 그대로 전송(복구), 없거나 미래면 `new Date().toISOString()`. (예약으로 미래 날짜 넣었다가 다시 즉시로 돌려도 원래 과거 날짜로 복구됨.)  
  - **비공개/일부공개**: `originPublishedAt`이 있으면 그대로 전송해 DB에 날짜를 유지. 없으면 null. (나중에 다시 공개로 돌릴 때 400 방지.)

### 5.2 백엔드 (apps/api/routers/posts.py)

- **update_post**: "발행일은 현재 시각 이전으로 설정할 수 없습니다" 검증 시, **분 단위(앞 16자리)**까지만 비교한다. 프론트에서 초가 `.slice(0,16)`으로 잘려 00초로 오기 때문에, 초 단위 차이로 같은 의도인데 400이 나지 않도록 한다. (`old_val = existing_str[:16]`, `new_val = body_str[:16]`, `new_val != old_val`일 때만 400.)
- **과거 허용 조건**: 이미 DB에 있던 발행일과 동일한 값(분 단위까지 같음)을 보내면 과거여도 통과. 새로 과거로 바꾸려고 할 때만 400.

### 5.3 시나리오 요약

| 동작 | published_at 전송 값 |
|------|----------------------|
| 이미 발행된 글 수정(즉시 공개 유지) | originPublishedAt(기존 날짜 유지) |
| 예약 → 즉시 공개로 변경 | origin이 과거면 origin, 아니면 now |
| 공개 → 비공개 저장 | origin이 있으면 origin(날짜 유지) |
| 비공개(초안) → 공개 | now |
| 예약 발행 선택 | form.published_at(미래 날짜) |

## 완료 기준

- 글 목록에서 필터·페이지네이션·수정/삭제 동작.
- PostEditor에서 Toast UI 에디터·설정 패널·이미지 업로드·유튜브 임베드 동작.
- 저장 시 posts·post_tags·attachment_asset_ids 반영.
