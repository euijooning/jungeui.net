# Jungeui Labs UI Kit - 디자인 가이드

클라이언트(방문자용)와 백오피스(관리자용)의 톤앤매너 통일을 위한 공통 컴포넌트·스타일 가이드.

## 원칙

- **가독성**: 텍스트 위주 콘텐츠에 맞춘 폰트 크기·줄간격.
- **다크/라이트**: 테마 토글 시 색상·Utterances 등 일괄 전환.
- **재사용**: Button, Card, Modal, Layout 등은 이 폴더에서 정의 후 각 앱에서 import.

## 구성

- `components/`: 실제 컴포넌트 코드 (프레임워크별로 하위 폴더 가능, 예: `react/`).
- 폰트·컬러 팔레트 등 스타일 상수는 `theme.js` 또는 `colors.js` 등으로 관리.

## 활용

- React 사용 시: npm workspace 또는 상대 경로로 `shared/ui-kit` 참조.
- 백오피스는 MUI 기반이므로, 공통으로 쓸 컴포넌트만 점진적으로 ui-kit으로 이전.
