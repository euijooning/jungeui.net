# Phase 04: 소개 페이지 (About)

구현 후 해당 항목을 체크. **Phase 완료 시 "완료 점검" 항목을 실행하고 보고.**

참조: [00-client-implementation-guide.md](00-client-implementation-guide.md), [docs/02-api-spec.md](../../docs/common/02-api-spec.md), [sungbin.dev/about](https://sungbin.dev/about/)

---

## 경로 및 구성

- [ ] **1** 경로: `/about`.
- [ ] **2** 인사말·자기소개 영역 (정적 마크업 또는 CMS는 추후).
- [ ] **3** 레이아웃: 상단 인사 → 경력 타임라인 → 프로젝트 그리드 순 (레퍼런스: sungbin.dev/about).

---

## 경력

- [ ] **4** GET /careers, sort_order 순 목록.
- [ ] **5** 타임라인/리스트 와꾸만 클라이언트에서 구현 — 등록·관리는 백오피스(경력 관리 메뉴).
- [ ] **6** 항목: 회사명·직함·기간·설명(description), 로고(logo_asset_id) 있으면 표시.

---

## 프로젝트

- [ ] **7** GET /projects (및 project_links, project_tags 필요 시 API 확장).
- [ ] **8** 그리드 카드 형태로 표시.
- [ ] **9** 카드 클릭 시 Accordion 확장 또는 상세 토글 (와꾸만 클라이언트, 등록·관리는 백오피스).
- [ ] **10** 프로젝트별 링크(project_links), 태그(project_tags) 노출.

---

## Phase 04 완료 점검 (구현 후 실행 후 보고)

- [ ] **11** `/about` 접속 시 인사말·경력·프로젝트 영역 표시.
- [ ] **12** 경력·프로젝트 데이터가 API 연동으로 노출됨.

**Phase 04 완료** (점검일: __________)
