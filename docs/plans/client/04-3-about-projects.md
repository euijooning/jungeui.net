# 04-4. About 페이지 프로젝트 섹션

구현 후 해당 항목을 체크. **Phase 완료 시 "완료 점검" 항목을 실행하고 보고.**

참조: [04-about.md](04-about.md), [02-post-list-and-sidebar.md](02-post-list-and-sidebar.md), [01-db-schema.md](../../guides/common/01-db-schema.md), [02-api-spec.md](../../guides/common/02-api-spec.md)

---

## 개요

- **위치**: `/about` 페이지, 태그 섹션 아래 **하늘색 배경 컨테이너**
- **형태**: 카로셀 (3개 풀 노출, 좌/우 화살표, 하단 인디케이터, 그라데이션 페이드)
- **가로 기준선**: 소개·태그 영역과 동일 (`max-w-[1200px] mx-auto px-4 md:px-6`)

---

## 1. 컨테이너·카로셀

- [x] **1** 하늘색 배경 (`bg-[#F0F9FF]`) 컨테이너
- [x] **2** 3개 카드 풀 노출, 가운데 정렬, overflow 그라데이션 페이드
- [x] **3** 좌측·우측 이동 화살표 아이콘
- [x] **4** 하단 Carousel Indicator (점) 클릭 시 해당 슬라이드로 이동

---

## 2. 카드 구조 (ProjectCard)

- [x] **5** **01. 대표이미지**: w-14 h-14 정사각형, 없으면 영역 숨김
- [x] **6** **02. 프로젝트명**: 최대 10자, 두 줄 (`line-clamp-2`)
- [x] **7** **03. 기간 + 링크**: 한 줄 배치, 링크 최대 5개
- [x] **8** **04. 태그**: 최대 6개 (3x2), 테두리, `flex-wrap`
- [x] **9** **05. 설명**: 최대 100자, 3줄, `leading-relaxed`
- [x] **10** **06. 상세이미지**: intro_image 있으면 aspect-2/1, 없으면 영역 숨김

---

## 3. API·데이터

- [x] **11** `fetchProjects()` — GET /api/projects
- [x] **12** projects API: thumbnail URL 포함 응답 (assets JOIN)
- [x] **13** project_links, project_tags API에 포함

---

## 4. 공통

- [x] **14** About.jsx에 프로젝트 섹션 추가 (태그 아래)
- [x] **15** ProjectCard.jsx 별도 컴포넌트

---

## 완료 점검

- [x] `/about`에서 프로젝트 카로셀(3.5개, 화살표, 인디케이터) 표시
- [x] 카드: 대표이미지·제목·링크·태그·설명 노출
- [x] 하늘색 배경 컨테이너, 가로 폭 일치

**Phase 완료** (점검일: 2025-02-07)
