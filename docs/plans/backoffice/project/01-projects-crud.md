# 프로젝트 CRUD

구현 후 해당 항목을 체크.

참조: [career/01-careers-crud.md](../career/01-careers-crud.md), [01-db-schema.md](../../../guides/common/01-db-schema.md), [02-api-spec.md](../../../guides/common/02-api-spec.md)

---

## 0. 우선 작업: 파일 관리 메뉴 제거 (완료)

- [x] AdminLayout navSections에서 **파일 보관함** (`/assets`) 항목 제거
- [x] App.jsx: `/assets` Route 제거
- [x] AssetList 페이지·import 제거

※ 파일 업로드는 포스트·경력·프로젝트 편집 시 인라인으로 처리. 별도 갤러리 페이지 없음.

---

## 1. API 확장 (projects)

- [x] POST /api/projects — 프로젝트 생성
- [x] PUT /api/projects/{id} — 프로젝트 수정
- [x] DELETE /api/projects/{id} — 프로젝트 삭제
- [x] PATCH /api/projects/reorder — sort_order 변경 (배열 전송)
- [x] project_links, project_tags 저장 로직 (생성/수정 시 함께 처리)

---

## 2. 백오피스 ProjectsList

- [x] 목록: GET /api/projects, sort_order 순
- [x] 드래그앤드롭 정렬 → PATCH /api/projects/reorder
- [x] 등록 폼: title, description, start_date(연·월), end_date(연·월), thumbnail_asset_id, intro_image_asset_id, project_links(최대 5), project_tags(최대 6)
- [x] 수정 폼: 동일 필드
- [x] 삭제: DELETE /api/projects/{id}
- [x] 썸네일·소개 이미지: POST /api/assets/upload 연동 (썸네일 정사각형 리사이즈)
- [x] 태그: Enter로 추가, 최대 6개

※ subtitle 제거됨. 날짜는 연·월만 입력, 과거만 선택 가능.

---

## 3. 페이지 구분

- [x] 소개 관리: 메시지 / 프로젝트 / 경력 하위 메뉴 (AdminLayout)
- [x] 프로젝트 목록·등록·수정 라우트: `/projects`, `/projects/new`, `/projects/:id/edit`

---

## 완료 점검

- [x] 파일 보관함 메뉴·라우트 제거됨
- [x] 프로젝트 목록·등록·수정·삭제·정렬 동작

**Phase 완료** (점검일: 2025-02-07)
