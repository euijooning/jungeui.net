# Phase 04: 파일 보관함 (Assets)

## 참조

- [docs/01-db-schema.md](../docs/01-db-schema.md): assets 테이블.
- [docs/02-api-spec.md](../docs/02-api-spec.md): POST /assets/upload, GET /assets, DELETE /assets/{id}.

## 1. 자산 목록 (AssetsList)

**파일**: `apps/backoffice/src/pages/AssetsList.jsx`

- **API**: GET /api/assets. 갤러리 그리드 뷰.
- **표시**: 썸네일(또는 아이콘), original_name, size_bytes, uploaded_at 등.
- **기능**:
  - **URL 복사**: 해당 자산의 공개 URL(또는 서버 경로 기반 URL) 클립보드 복사.
  - **삭제**: DELETE /api/assets/{id}. 삭제 전 API에서 사용 여부 체크( posts/careers/projects 참조 중이면 거부 또는 경고). 백엔드 구현 시 사용 여부 검사 필수.

## 2. 업로드

- **진입점**: Write(이미지), Careers(로고), Projects(썸네일) 등에서 사용. POST /api/assets/upload.
- **응답**: 업로드된 asset id·file_path·URL 등. 프론트는 해당 id를 thumbnail_asset_id, logo_asset_id 등으로 저장.

## 완료 기준

- 파일 보관함 갤러리·URL 복사·삭제(사용 여부 체크 반영) 동작.
- 다른 화면(글 쓰기, 경력, 프로젝트)에서 업로드 후 자산 목록과 연동.
