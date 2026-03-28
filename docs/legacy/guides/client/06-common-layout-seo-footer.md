# Phase 05: 헤더·푸터·SEO

구현 후 해당 항목을 체크. **Phase 완료 시 "완료 점검" 항목을 실행하고 보고.**

참조: [01-implementation-guide.md](01-implementation-guide.md), [../common/02-api-spec.md](../common/02-api-spec.md), [codegradation 검색·헤더](https://codegradation.tistory.com/)

---

## 5-1. 헤더 구조

**데스크탑 / 375px 초과**

```
[로고]  Posts  About  Résumé  |  [검색창] [검색]  🌙  [카테고리]
```

- [x] **1** 검색창: 헤더 우측, **375px 이하에서 숨김** (`max-[375px]:hidden`).
- [x] **2** 검색은 **제목 기준**, **버튼 클릭 시만** 실행.
- [x] **3** 검색 결과는 **기존 카드 그리드 재사용** (Phase 02).
- [x] **4** 로고: 클릭 시 `/` 이동. **375px 이하에서는 헤더 중앙 정렬** (`max-[375px]:absolute left-1/2 -translate-x-1/2`).
- [x] **5** 메뉴: Posts, About, **Résumé**(외부 링크, Google Docs). **375px 이하에서 inline 숨김**, 메인 메뉴는 왼쪽 햄버거로 대체.
- [x] **6** 다크모드 토글 (🌙). 모바일에서 **다크모드 → 카테고리** 순서(카테고리 햄버거가 오른쪽 끝).

**375px 이하 (좁은 모바일)**

- [x] **왼쪽**: 메인 메뉴 햄버거(Menu 아이콘) → 클릭 시 **왼쪽**에서 메인 메뉴 오버레이(Posts, About, Résumé).
- [x] **중앙**: 로고(절대 위치로 중앙 고정).
- [x] **오른쪽**: 검색 숨김, 다크모드, 카테고리 햄버거(**FolderOpen** 아이콘, 메인 메뉴와 구분).
- [x] 검색·메인 메뉴 숨김 기준 통일: `max-[375px]` (아이폰 SE 375px 포함 시 레이아웃 유지).

**구현**: [apps/client/src/components/SharedLayout.jsx](../../apps/client/src/components/SharedLayout.jsx) — `mainMenuOverlayOpen` 상태, 카테고리 오버레이(`overlayOpen`)와 별도. body 스크롤 잠금·ESC는 두 오버레이 공통.

---

## 푸터

- [ ] **7** 이메일 링크 (연락처).
- [ ] **8** 저작권 문구: **"© 2026 Jungeui Lab. All rights reserved."**
- [ ] **9** Admin 링크 (백오피스 로그인 페이지).
- [ ] **10** 소셜 링크 (선택).

---

## SEO 및 사이트맵

- [ ] **11** 동적 title·description·og:image (글 상세·About·목록 등 페이지별).
- [ ] **12** sitemap.xml 연동 (GET /sitemap.xml 명세 참고).

---

## Phase 05 완료 점검 (구현 후 실행 후 보고)

- [ ] **13** 모든 페이지에서 헤더(검색·로고·메뉴·다크모드)·푸터(이메일·저작권·Admin) 노출.
- [ ] **14** 검색 버튼 클릭 시 제목 검색 후 카드 그리드 표시.
- [ ] **15** SEO 메타·sitemap 연동 확인.

**Phase 05 완료** (점검일: __________)
