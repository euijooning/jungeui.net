# Phase 03: 경력·프로젝트 관리

## 참조

- [docs/01-db-schema.md](../docs/01-db-schema.md): careers, projects, project_links, project_tags, assets, tags.
- [docs/02-api-spec.md](../docs/02-api-spec.md): careers/projects CRUD, PATCH reorder.

## 1. 경력 (CareersList)

**파일**: `apps/backoffice/src/pages/CareersList.jsx` (및 등록/수정 폼)

- **목록**: GET /api/careers. sort_order 순. 드래그앤드롭으로 순서 변경 → PATCH /api/careers/reorder (순서 배열 전송).
- **등록/수정 폼**: company_name, role, start_date, end_date(NULL이면 재직중), description. logo_asset_id(로고 이미지 업로드 → POST /api/assets/upload). sort_order.
- **API**: POST /api/careers, PUT /api/careers/{id}, PATCH /api/careers/reorder.

## 2. 프로젝트 (ProjectsList)

**파일**: `apps/backoffice/src/pages/ProjectsList.jsx` (및 등록/수정 폼)

- **목록**: GET /api/projects. sort_order 순. 드래그앤드롭 → PATCH /api/projects/reorder.
- **등록/수정 폼**:
  - title, description, start_date(연·월), end_date(연·월), sort_order. (subtitle 제거)
  - thumbnail_asset_id (대표 이미지, 정사각형 리사이즈), intro_image_asset_id (소개 이미지).
  - **project_links**: 링크명·URL 다중 입력, 최대 5개. sort_order.
  - **project_tags**: Enter로 추가, 최대 6개 (기술 스택).
  - 날짜: 과거만 선택 가능.
- **API**: POST /api/projects, PUT /api/projects/{id}, PATCH /api/projects/reorder. project_links·project_tags는 프로젝트 저장 시 함께 전송하거나 별도 엔드포인트.

## 완료 기준

- 경력 목록·드래그 정렬·등록/수정(로고 업로드 포함) 동작.
- 프로젝트 목록·드래그 정렬·등록/수정(썸네일·링크 여러 개·태그) 동작.
