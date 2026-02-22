# Phase 04: 소개 페이지 (About)

구현 후 해당 항목을 체크. **Phase 완료 시 "완료 점검" 항목을 실행하고 보고.**

참조: [00-client-implementation-guide.md](00-client-implementation-guide.md), [02-api-spec.md](../../guides/common/02-api-spec.md), [sungbin.dev/about](https://sungbin.dev/about/)

---

## 경로 및 구성 순서 (고정)

- [x] **1** 경로: `/about`.
- [x] **2** 구성 순서: **인사말** → **태그** → **프로젝트(Grid Card)**.

---

## 4-1. 인사말

- [x] **3** 인사말·자기소개 영역 (API 메시지 연동, 04-2 완료).

---

## 4-2. 태그

- [x] **4** → [04-3-about-tags.md](04-3-about-tags.md) 상세 계획 완료

---

## 4-3. 프로젝트(Project)

- [x] **5** GET /projects (및 project_links, project_tags 필요 시 API 확장).
- [x] **6** **글 목록 카드와 동일한 카드 컴포넌트** 사용.
- [x] **7** 카드 클릭 시 **Accordion** 또는 **상세 토글**.
- [x] **8** 프로젝트별 링크(project_links), 태그(project_tags) 노출.
- [x] **9** 프로젝트 옆에 **경력 버튼** 배치. 클릭 시 **모달**로 경력(타임라인) 표시.

---

## 4-4. 경력(Career) — 모달

- [x] **10** GET /careers, sort_order 순 목록.
- [x] **11** 경력 버튼 클릭 시 모달에 세로 타임라인 형식으로 표시.
- [x] **12** 항목: 기간, 회사 이미지(선택), 회사명, 역할, 링크, 한 일(최대 5), 태그(최대 5). 상세 → [04-5-about-career-modal.md](04-5-about-career-modal.md).

---

## Phase 04 완료 점검 (구현 후 실행 후 보고)

- [x] **13** `/about` 접속 시 인사말·태그·프로젝트(그리드) 표시.
- [x] **14** 프로젝트 옆 경력 버튼 클릭 시 모달에 경력 타임라인 표시.
- [x] **15** 경력·프로젝트 데이터가 API 연동으로 노출됨.

**Phase 04 완료** (점검일: 2025-02-10)
