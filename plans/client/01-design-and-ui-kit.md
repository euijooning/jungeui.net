# Phase 01: 디자인 가이드 및 공통 컴포넌트

구현 후 해당 항목을 체크. **Phase 완료 시 "완료 점검" 항목을 실행하고 보고.**

참조: [00-client-implementation-guide.md](00-client-implementation-guide.md), [docs/04-design-guide.md](../../docs/common/04-design-guide.md), [docs/03-folder-structure.md](../../docs/common/03-folder-structure.md)

---

## 디자인 가이드 (체크리스트)

- [ ] **1** 브랜드 컬러: **하늘색·연한 파랑** 계열 정의 (primary, secondary, 배경/텍스트).
- [ ] **2** [docs/04-design-guide.md](../../docs/common/04-design-guide.md) 연동: 가독성(폰트 크기·줄간격), 다크/라이트 테마.
- [ ] **3** 테마 토글 시 Utterances·코드 블록 등 일괄 전환.
- [ ] **4** 스타일 상수: `shared/ui-kit` 내 `theme.js` 또는 `colors.js` (하늘색/연파랑 팔레트 포함).
- [ ] **5** 라이트 모드: 배경·텍스트·링크 색상 정의.
- [ ] **6** 다크 모드: 배경·텍스트·링크 색상 정의, 대비 확보.

---

## 공통 컴포넌트 (체크리스트)

- [ ] **7** Button: primary / secondary / ghost 변형, 다크 모드 대응.
- [ ] **8** Card: 썸네일·제목·요약·메타(카테고리·작성일·태그) 영역 — 글 목록 카드용.
- [ ] **9** Layout: 헤더 + 메인 + 푸터 골격.
- [ ] **10** Layout: 2컬럼 레이아웃 옵션 (예: 70% 메인 / 30% 사이드바).
- [ ] **11** Modal/라이트박스: 이미지 확대용 (글 상세).
- [ ] **12** 공통 컴포넌트는 `shared/ui-kit/components/` (필요 시 `react/` 하위)에 정의, client에서 import.

---

## Phase 01 완료 점검 (구현 후 실행 후 보고)

- [ ] **13** theme/colors 적용 시 하늘색·연파랑 톤이 일관되게 노출됨.
- [ ] **14** 다크/라이트 전환 시 주요 UI가 정상 전환됨.
- [ ] **15** Button, Card, Layout, 라이트박스가 client 앱에서 import 가능하고 사용 가능함.

**Phase 01 완료** (점검일: __________)
