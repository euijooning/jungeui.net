# Phase 05: 공통 레이아웃·SEO·푸터

구현 후 해당 항목을 체크. **Phase 완료 시 "완료 점검" 항목을 실행하고 보고.**

참조: [00-client-implementation-guide.md](00-client-implementation-guide.md), [docs/02-api-spec.md](../../docs/common/02-api-spec.md), [codegradation 검색·헤더](https://codegradation.tistory.com/category/%5B%EA%B8%B0%ED%9A%8D%5D/%ED%99%94%EB%A9%B4%EC%84%A4%EA%B3%84%20%EC%8B%AC%ED%99%94)

---

## 상단 검색

- [ ] **1** 헤더 **가장 상단**에 검색창 배치 (레퍼런스: codegradation).
- [ ] **2** **제목 일치** 기준으로 검색.
- [ ] **3** **검색 버튼을 눌렀을 때만** 실행 (입력 중 자동 검색 없음).
- [ ] **4** 검색 결과는 리스트 화면(Phase 02 박스형 리스트·페이지네이션)으로 표시.

---

## 헤더

- [ ] **5** 로고 (클릭 시 `/` 또는 `/posts` 이동).
- [ ] **6** 메뉴: Posts, 소개(About), 이력서(추후 추가). 방명록은 선택 사항.
- [ ] **7** 다크모드 토글.
- [ ] **8** 검색창과 메뉴 배치 조화 (상단 검색 → 로고·메뉴 또는 동일 행 내 배치).

---

## 푸터

- [ ] **9** 이메일 링크 (연락처).
- [ ] **10** 저작권 문구: **"© 2026 Jungeui Lab. All rights reserved."**
- [ ] **11** Admin 링크 (백오피스 로그인 페이지).
- [ ] **12** 소셜 링크 (선택).

---

## SEO 및 사이트맵

- [ ] **13** 동적 title·description·og:image (글 상세·About·목록 등 페이지별).
- [ ] **14** sitemap.xml 연동 (GET /sitemap.xml 명세 참고).

---

## Phase 05 완료 점검 (구현 후 실행 후 보고)

- [ ] **15** 모든 페이지에서 헤더(검색·로고·메뉴·다크모드)·푸터(이메일·저작권·Admin) 노출.
- [ ] **16** 검색 버튼 클릭 시 제목 검색 후 리스트 표시.
- [ ] **17** SEO 메타·sitemap 연동 확인.

**Phase 05 완료** (점검일: __________)
