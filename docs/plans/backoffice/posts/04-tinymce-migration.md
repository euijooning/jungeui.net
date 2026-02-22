# Toast UI Editor → TinyMCE 로컬 마이그레이션

## 완료 일자

2026-02-15

## 배경

- **기존**: Toast UI Editor (CDN 로드, `window.toastui.Editor`)
- **변경**: TinyMCE 로컬(self-hosted) 설치 — API 키·사용량 제한 없음
- **데이터**: 두 에디터 모두 `content_html`(HTML) 저장 — API/DB 스키마 변경 없음

## 적용 내용

### 1. 패키지

- `@tinymce/tinymce-react`, `tinymce` 설치 (apps/backoffice)

### 2. 에디터 파일 배치

- `node_modules/tinymce/*` → `apps/backoffice/public/tinymce/`
- 빌드 시 `dist/tinymce/tinymce.min.js`로 서빙

### 3. PostEditor.jsx

- Toast UI 관련 코드 제거 (CDN, loadScript, loadCss, toastUILoaded, #post-editor div 등)
- TinyMCE `Editor` 컴포넌트 사용, `tinymceScriptSrc="/tinymce/tinymce.min.js"`
- `images_upload_handler`로 기존 업로드 API 연동
- `attachmentInputRef`, `attachmentUploading`, `canSave` 유지
- H5/H6 → H4 변환 유지

### 4. 글 상세 페이지

- Client / Backoffice 모두 `content_html` + prose 클래스로 렌더링
- HTML 포맷 호환 → 별도 수정 없음

## 참고

- [01-posts-and-editor.md](01-posts-and-editor.md): 에디터 사양 (TinyMCE 로컬로 업데이트됨)
