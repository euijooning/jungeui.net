# 경력 관리

## 참조

- [01-db-schema.md](../../../guides/common/01-db-schema.md): careers, assets
- [02-api-spec.md](../../../guides/common/02-api-spec.md): careers CRUD, PATCH reorder

## 1. 경력 (CareersList)

**파일**: `apps/backoffice/src/pages/CareersList.jsx` (및 등록/수정 폼)

- **목록**: GET /api/careers. sort_order 순. 드래그앤드롭으로 순서 변경 → PATCH /api/careers/reorder (순서 배열 전송).
- **등록/수정 폼**: company_name, role, start_date, end_date(NULL이면 재직중), description. logo_asset_id(로고 이미지 업로드 → POST /api/assets/upload). sort_order.
- **API**: POST /api/careers, PUT /api/careers/{id}, PATCH /api/careers/reorder.

## 2. 페이지·메뉴

- **소개 관리** 아코디언 하위: 메시지, **경력** → `/careers`, 프로젝트
- 라우트: `/careers`, `/careers/new`, `/careers/:id/edit`

## 완료 기준

- 경력 목록·드래그 정렬·등록/수정(로고 업로드 포함) 동작.

---

## 구현 현황

Phase 03 완료. 경력(CareerList·CareerForm·CareerFormModal) 목록·드래그 reorder·등록/수정 동작. 경력은 기간순 정렬·날짜 검증(미래/종료일 min)·엔터 제출 방지 등 반영됨.
