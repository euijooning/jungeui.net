# Backoffice Admin

React-admin 기반 관리자 시스템

## 기술 스택

- React 18
- React-admin 5
- Vite
- Material-UI (MUI)

## 설치

```bash
npm install
```

## 개발 서버 실행

```bash
npm run dev
```

서버는 `http://localhost:5180`에서 실행됩니다.

## 빌드

```bash
npm run build
```

## 프로젝트 구조

```
src/
├── App.jsx              # 메인 앱 컴포넌트
├── main.jsx            # 진입점
├── authProvider.js     # 인증 프로바이더
├── dataProvider.js     # 데이터 프로바이더
├── components/         # 컴포넌트
│   └── AdminLayout.jsx # 관리자 레이아웃
├── pages/              # 페이지 컴포넌트
│   ├── Dashboard.jsx
│   ├── Users.jsx
│   ├── Notices.jsx
│   └── ...
├── styles/             # 스타일
│   └── AdminTheme.js   # 테마 설정
└── lib/                # 유틸리티
    └── apiClient.js    # API 클라이언트
```

