# Phase 05: 헤더·푸터·SEO

구현 후 해당 항목을 체크. **Phase 완료 시 "완료 점검" 항목을 실행하고 보고.**

참조: [00-client-implementation-guide.md](00-client-implementation-guide.md), [02-api-spec.md](../../guides/common/02-api-spec.md), [codegradation 검색·헤더](https://codegradation.tistory.com/)

---

## 5-1. 헤더 구조

```
[검색창]  [로고]  Posts  About  Resume  🌙
```

- [ ] **1** 검색창: **가장 상단** 또는 헤더 좌측 배치.
- [ ] **2** 검색은 **제목 기준**, **버튼 클릭 시만** 실행.
- [ ] **3** 검색 결과는 **기존 카드 그리드 재사용** (Phase 02).
- [ ] **4** 로고: 클릭 시 `/` 또는 `/posts` 이동.
- [ ] **5** 메뉴: Posts, About, Resume(추후 추가).
- [ ] **6** 다크모드 토글 (🌙).

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
