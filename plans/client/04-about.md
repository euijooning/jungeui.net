# Phase 04: 소개 페이지 (About)

구현 후 해당 항목을 체크. **Phase 완료 시 "완료 점검" 항목을 실행하고 보고.**

참조: [00-client-implementation-guide.md](00-client-implementation-guide.md), [docs/02-api-spec.md](../../docs/common/02-api-spec.md), [sungbin.dev/about](https://sungbin.dev/about/)

---

## 경로 및 구성 순서 (고정)

- [ ] **1** 경로: `/about`.
- [ ] **2** 구성 순서: **인사말** → **경력(Timeline)** → **프로젝트(Grid Card)**.

---

## 4-1. 인사말

- [ ] **3** 인사말·자기소개 영역 (정적 마크업 또는 CMS는 추후).

---

## 4-2. 경력(Career)

- [ ] **4** GET /careers, sort_order 순 목록.
- [ ] **5** 세로 타임라인 형식.
- [ ] **6** 항목: ● 회사명 / 직함, 기간, 설명.
- [ ] **7** 데이터 없을 때도 **좌측 정렬** 유지.

---

## 4-3. 프로젝트(Project)

- [ ] **8** GET /projects (및 project_links, project_tags 필요 시 API 확장).
- [ ] **9** **글 목록 카드와 동일한 카드 컴포넌트** 사용.
- [ ] **10** 카드 클릭 시 **Accordion** 또는 **상세 토글**.
- [ ] **11** 프로젝트별 링크(project_links), 태그(project_tags) 노출.

---

## Phase 04 완료 점검 (구현 후 실행 후 보고)

- [ ] **12** `/about` 접속 시 인사말·경력(타임라인)·프로젝트(그리드) 표시.
- [ ] **13** 경력·프로젝트 데이터가 API 연동으로 노출됨.

**Phase 04 완료** (점검일: __________)
