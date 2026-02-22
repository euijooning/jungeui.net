# Jungeui Lab UI Kit - 디자인 가이드

클라이언트(방문자용)와 백오피스(관리자용)의 톤앤매너 통일을 위한 공통 컴포넌트·스타일 가이드.

## 원칙

- **가독성**: 텍스트 위주 콘텐츠에 맞춘 폰트 크기·줄간격.
- **다크/라이트**: 테마 토글 시 색상·Utterances 등 일괄 전환.
- **재사용**: Button, Card, Modal, Layout 등은 이 폴더에서 정의 후 각 앱에서 import.

---

## 색상 팔레트 (스카이블루 기준)

프로젝트 전반의 메인 액센트는 **스카이블루** 계열로 통일한다. 용도별로 아래 두 세트를 사용한다.

### 1. AdminLayout (사이드바 메뉴)

백오피스 **AdminLayout** 사이드바 메뉴 선택·호버에는 **Tailwind CSS `sky` 팔레트**를 사용한다.

| 용도 | Tailwind 토큰 | HEX |
|------|----------------|-----|
| 선택 메뉴 배경 (메인 스카이블루) | `sky-500` | `#0ea5e9` |
| 호버·강조 | `sky-600` | `#0284c7` |
| 연한 배경 | `sky-50` | `#f0f9ff` |
| 조금 더 진한 연한 배경 | `sky-100` | `#e0f2fe` |

- **사이드바에 노출되는 메인 스카이블루**: `#0ea5e9` (Tailwind `sky-500`).

### 2. 테마 (MUI / 버튼·링크 등)

백오피스는 `styles/AdminTheme.js`를 사용하며, MUI·버튼·링크 primary 색상은 아래 팔레트를 참고한다.

| 용도 | HEX |
|------|-----|
| **main** (버튼·링크·MUI primary) | `#35C5F0` |
| **dark** (호버·강조) | `#2BB8E3` |
| **light** (연한 배경) | `#E8F8FE` |

- 버튼, 링크, MUI/테마 기반 컴포넌트의 **메인 스카이블루**: `#35C5F0`.

### 요약

- **사이드바 메뉴(AdminLayout)**: `#0ea5e9` (sky-500).
- **버튼·테마(MUI/AdminTheme 등)**: `#35C5F0` (main).

---

## 구성

- `components/`: 실제 컴포넌트 코드 (프레임워크별로 하위 폴더 가능, 예: `react/`).
- 폰트·컬러 팔레트 등 스타일 상수는 백오피스 `AdminTheme.js`(MUI), `index.css`(Tailwind·다크 모드)로 관리. 상세는 [10-backoffice-ui-guide.md](10-backoffice-ui-guide.md) 참고.

## 활용

- React 사용 시: npm workspace 또는 상대 경로로 `shared/ui-kit` 참조.
- 백오피스는 MUI 기반이므로, 공통으로 쓸 컴포넌트만 점진적으로 ui-kit으로 이전.
