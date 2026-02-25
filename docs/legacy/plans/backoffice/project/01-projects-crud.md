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

---

## 4. 프로젝트 태그 순서 보장 (방안 B)

태그가 "입력한 순서·지정한 순서"대로 저장·노출되도록 `project_tags.sort_order` 도입 및 백오피스 드래그 앤 드롭 순서 조정 UI 추가.

### 구현 순서

- [x] **STEP 1 — DB 스키마**
  - 기존 DB: `python scripts/add_project_tags_sort_order.py` 또는 `ALTER TABLE project_tags ADD COLUMN sort_order INT NOT NULL DEFAULT 0;`
  - 신규 환경: `apps/api/core/db_init.py`의 `project_tags` CREATE문에 `sort_order INT NOT NULL DEFAULT 0` 추가
- [x] **STEP 2 — API**
  - `apps/api/routers/projects.py`  
    - GET(목록): 태그 쿼리에 `ORDER BY pt.sort_order ASC, pt.tag_id ASC` 추가  
    - POST/PUT: `project_tags` INSERT 시 `enumerate`로 `sort_order = index` 저장
- [x] **STEP 3 — 백오피스 UI**
  - `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` 설치
  - `SortableTag.jsx`: `useSortable`, 삭제 버튼에 `onPointerDown={(e) => e.stopPropagation()}` 적용
  - `ProjectForm.jsx`: `DndContext` + `SortableContext`(horizontalListSortingStrategy), `useSensors`로 `PointerSensor`에 `activationConstraint: { distance: 5 }` 설정, `onDragEnd`에서 `arrayMove`로 `form.project_tags` 재정렬
