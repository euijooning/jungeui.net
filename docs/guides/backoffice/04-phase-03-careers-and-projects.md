# Phase 03: 경력·프로젝트 관리

## 참조

- [../common/01-db-schema.md](../common/01-db-schema.md): careers, projects, project_links, project_tags, assets, tags.
- [../common/02-api-spec.md](../common/02-api-spec.md): careers/projects CRUD, PATCH reorder.

---

## 1. 경력 (CareersList)

**파일**: `apps/backoffice/src/pages/CareersList.jsx` (및 등록/수정 폼)

- **목록**: GET /api/careers. sort_order 순. 드래그앤드롭으로 순서 변경 → PATCH /api/careers/reorder (순서 배열 전송).
- **등록/수정 폼**: company_name, role, start_date, end_date(NULL이면 재직중), description. logo_asset_id(로고 이미지 업로드 → POST /api/assets/upload). sort_order. career_links(link_name, link_url, 최대 5), career_highlights(최대 5), career_tags(최대 5).
- **이미지 표시**: 상세/수정 시 API가 logo URL을 주지 않아도 logo_asset_id가 있으면 `/api/assets/:id/download`로 미리보기 표시(폴백).
- **API**: POST /api/careers, PUT /api/careers/{id}, PATCH /api/careers/reorder.

## 2. 프로젝트 (ProjectsList)

**파일**: `apps/backoffice/src/pages/ProjectsList.jsx` (및 등록/수정 폼)

- **목록**: GET /api/projects. sort_order 순. 드래그앤드롭 → PATCH /api/projects/reorder.
- **등록/수정 폼**:
  - title(프로젝트명, 최대 25자), description, start_date(연·월), end_date(연·월), sort_order. (subtitle 제거)
  - thumbnail_asset_id (대표 이미지, 정사각형 리사이즈), intro_image_asset_id (소개 이미지).
  - **project_links**: 링크명·URL 다중 입력, 최대 5개. sort_order.
  - **project_tags**: Enter로 추가, 최대 6개 (기술 스택).
  - 날짜: 과거만 선택 가능.
- **이미지 표시**: 상세/수정/상세 모달에서 API가 thumbnail·intro_image URL을 주지 않아도 해당 asset_id가 있으면 `/api/assets/:id/download`로 표시(폴백). 상세 모달에는 소개 이미지 영역 포함.
- **API**: POST /api/projects, PUT /api/projects/{id}, PATCH /api/projects/reorder. project_links·project_tags는 프로젝트 저장 시 함께 전송하거나 별도 엔드포인트.

## 완료 기준

- 경력 목록·드래그 정렬·등록/수정(로고 업로드 포함) 동작.
- 프로젝트 목록·드래그 정렬·등록/수정(썸네일·링크 여러 개·태그) 동작.

---

## Phase 03 완료

경력(CareerList·CareerForm·CareerFormModal·/careers/new)·프로젝트(ProjectList·ProjectForm·ProjectFormModal·/projects/new) 목록·드래그 reorder·등록/수정 동작. 경력은 기간순 정렬·번호 역순·날짜 검증(미래/종료일 min)·엔터 제출 방지·career_links/highlights/tags API·DB 반영. 프로젝트는 생성 시 단일 트랜잭션 FK 수정·필수값 및 종료일/진행중 검사·시작일 기준 종료일 min·목록 체크박스 제거 반영됨.
