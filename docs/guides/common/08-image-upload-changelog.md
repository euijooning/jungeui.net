# 이미지 업로드 관련 변경 사항

## 1. `apps/api/routers/assets.py`

- **업로드 경로 구조 통일**
  - `folder=projects`: `projects/{pid}/` → **`images/projects/{pid}/`**
  - `folder=careers`: `careers/{pid}/` → **`images/careers/{pid}/`**
  - 글(기본): 이미지 → **`images/posts/{yyyy}/{mm}/{dd}/{pid}/`**, 문서 → **`documents/{yyyy}/{mm}/{dd}/{pid}/`** (기존과 동일하나 이미지는 `images/posts` 하위로 명확히 분리)

---

## 2. `apps/api/routers/posts.py`

- **`_relocate_post_temp_asset`**  
  - docstring만 수정: `images/posts/.../temp/` → `.../post_id/` 로 이동한다고 명시.

- **`_relocate_post_content_temp_assets` 추가**
  - 본문 `content_html`에 URL로 참조된 `images/posts/.../temp/` asset을 찾아서 `post_id` 폴더로 이동.
  - 상대 URL(`/static/uploads/...`) 또는 절대 URL(경로 문자열 `fp` 포함) 둘 다 매칭.

- **create_post / update_post**
  - 썸네일·첨부 relocate 후 **`_relocate_post_content_temp_assets(new_id|post_id, body.content_html, ...)`** 호출 추가.
  - 그 다음 기존대로 `content_html` / `content_json`에서 `/temp/` → `/{post_id}/` REPLACE 유지.

---

## 3. `apps/api/routers/projects.py`

- **`_relocate_temp_asset`**
  - 기대 경로: `projects/temp/` → **`images/projects/temp/`**
  - 이동 대상: **`images/projects/{project_id}/{filename}`**
  - docstring 갱신.

---

## 4. `apps/api/routers/careers.py`

- **`_relocate_temp_asset`**
  - 기대 경로: `careers/temp/` → **`images/careers/temp/`**
  - 이동 대상: **`images/careers/{career_id}/{filename}`**
  - docstring 갱신.

---

## 5. `apps/backoffice/src/pages/posts/PostEditor.jsx`

- **컴포넌트 상단**
  - `apiBase` = `VITE_API_URL` (끝 슬래시 제거).
  - `toImageSrc(url)`: `apiBase` 있으면 **절대 URL** (`apiBase + url`), 없으면 상대 URL 그대로. 이미 `http`로 시작하면 그대로 반환.

- **에디터 이미지 업로드**
  - `uploadImageBlob(blob, source)` 함수로 툴바/붙여넣기/다중 업로드 공통화.
  - **addImageBlobHook**: 업로드 후 `callback(toImageSrc(url), '')` — alt 빈 문자열.
  - **붙여넣기(onPaste)**: `uploadImageBlob` 사용, 삽입 시 `toImageSrc(url)` 적용, `el.addEventListener('paste', onPaste, true)`.
  - **handleMultiImageChange**: 삽입 시 `toImageSrc(url)` 적용.

---

## 요약

| 구분 | 내용 |
|------|------|
| 경로 | 이미지 전부 **images/** 하위: posts, projects, careers 구분. 문서는 **documents/** 유지. |
| 글 저장 | 본문에 참조된 temp 이미지도 **post_id** 폴더로 이동 + HTML/JSON 내 `/temp/` 치환. |
| 에디터 | 이미지 URL을 **절대 URL**로 넣어 API에서 직접 로드되도록 하고, alt 문구 제거. |
