# Phase 01: 글로벌 레이아웃·색상 테마·공통 컴포넌트

구현 후 해당 항목을 체크. **Phase 완료 시 "완료 점검" 항목을 실행하고 보고.**

참조: [01-implementation-guide.md](01-implementation-guide.md), [../common/04-design-guide.md](../common/04-design-guide.md), [../common/03-folder-structure.md](../common/03-folder-structure.md)

---

## 1. 글로벌 레이아웃 규칙 (Client 공통)

### 1-1. 기본 컨테이너

```
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}
```

- [x] **1** 모든 페이지는 container 기준
- [x] **2** 본문 가운데 띄우기 ❌, **좌측 정렬 기본** ⭕

### 1-2. 2컬럼 레이아웃 (sungbin.dev 기준)

```
.layout-2col {
  display: grid;
  grid-template-columns: 7fr 3fr;
  gap: 32px;
}
```

| 영역 | 비율 |
|------|------|
| 메인 콘텐츠 | 70% |
| 사이드바 | 30% |

- [x] **3** 2컬럼 레이아웃 적용 (목록·About 등)
- [x] **4** 모바일: 1컬럼, 사이드바는 하단 이동

---

## 2. 색상 테마 가이드 (핵심)

Admin / Client / Theme(MUI) 색상 역할 분리.

### 2-1. AdminLayout – 사이드바 색상 (Tailwind)

**관리자 UI는 Tailwind sky 팔레트 사용**

| 클래스 | HEX | 용도 |
|--------|-----|------|
| sky-500 | #0ea5e9 | 선택된 메뉴 배경 (메인 하늘색) |
| sky-600 | #0284c7 | hover / 강조 |
| sky-50 | #f0f9ff | 연한 배경 |
| sky-100 | #e0f2fe | 조금 더 진한 연한 배경 |

👉 사이드바에서 보이는 하늘색 = #0ea5e9 (sky-500)

### 2-2. MUI theme.js (버튼·링크 등 인터랙션)

**클라이언트/어드민 공통 행동 색상**

```js
palette: {
  primary: {
    main: "#35C5F0",
    dark: "#2BB8E3",
    light: "#E8F8FE",
  },
}
```

| 용도 | HEX |
|------|-----|
| main | #35C5F0 |
| dark | #2BB8E3 |
| light | #E8F8FE |

👉 버튼, 링크, 포커스 포인트는 이 색만 사용

### 2-3. 색상 역할 정리 (중요)

| 영역 | 색상 |
|------|------|
| AdminLayout 사이드바 UI | #0ea5e9 (Tailwind sky-500) |
| 버튼 / 링크 / CTA | #35C5F0 (theme.js primary) |
| hover / 강조 | sky-600 또는 primary.dark |
| 배경 | white / dark-gray |
| 텍스트 | gray-800 / gray-100 |

**❗ 절대 섞지 말 것**
- 사이드바에 #35C5F0 ❌
- 버튼에 sky-500 ❌

- [x] **5** theme.js 또는 colors.js (shared/ui-kit) primary 팔레트 정의
- [x] **6** AdminLayout 사이드바는 sky-500 사용, Client 버튼/링크는 #35C5F0 사용

---

## 3. 다크 모드 규칙

- [x] **7** 배경: #0f172a
- [x] **8** 카드: #111827
- [x] **9** 텍스트: gray-100
- [x] **10** primary 색상은 그대로 유지
- [x] **11** Utterances 테마 연동 필수 (Phase 03에서 구현)

---

## 4. 공통 컴포넌트 (체크리스트)

- [x] **12** Button: primary / secondary / ghost 변형, theme primary(#35C5F0) 사용.
- [x] **13** Card: 썸네일·제목·요약·메타 — 글 목록 카드용 (Phase 02에서 상세 스펙).
- [x] **14** Layout: 헤더 + 메인 + 푸터 골격, 2컬럼 옵션 (7fr 3fr).
- [x] **15** Modal/라이트박스: 이미지 확대용 (글 상세).
- [x] **16** 공통 컴포넌트는 `shared/ui-kit/components/` (필요 시 `react/` 하위)에 정의.

### 헤더·네비 추가 적용

- **로고**: 높이 36px (favicon).
- **메뉴 링크(Posts/About)**: 간격 2rem. 호버 시 밑줄은 **text-decoration 대신 border-bottom** 사용(잘림 방지).
- **scrollbar-gutter: stable** (html): 목록↔상세 전환 시 스크롤바 유무로 인한 레이아웃 밀림 방지.

---

## Phase 01 완료 점검 (구현 후 실행 후 보고)

- [x] **17** theme/colors 적용 시 primary(#35C5F0)·Admin(sky-500) 역할 분리 확인.
- [x] **18** 다크/라이트 전환 시 배경·카드·텍스트 정상 전환.
- [x] **19** Button, Card, Layout, 라이트박스가 client 앱에서 import 가능.

**Phase 01 완료** (점검일: 2026-02-05)
