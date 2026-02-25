# 프로젝트 폴더 구조 (Monorepo)

## 원칙

- **Single Source of Truth**: Python 의존성은 루트 `requirements.txt` 하나로 관리.
- **Docs First**: 구현 가이드·스펙은 `docs/guides/` 에, 구현 계획은 `docs/plans/` 에 `.md` 로 우선 작성.
- **Component Reusability**: 공통 UI는 `shared/ui-kit` 에 두어 client·backoffice 가 공유.
- **Utility Scripts**: DB 마이그레이션, 시딩, 배포는 `scripts/` 에서 실행.

## 디렉터리 트리

```
jungeui/
├── .venv/                 # 공통 Python 가상환경
├── requirements.txt       # 전체 Python 패키지 명세 (API + Scripts)
├── .gitignore
├── README.md
│
├── docs/                  # 문서 루트
│   ├── guides/            # 구현 가이드·명세 (.md)
│   │   ├── common/        # 공통 (01-db-schema, 02-api-spec, 03~07)
│   │   ├── backoffice/    # 백오피스 (01-implementation-guide 등)
│   │   ├── client/        # 클라이언트 (01~07)
│   │   ├── convention/    # 코딩 컨벤션
│   │   └── deploy/        # 배포 매뉴얼
│   └── plans/             # 구현 계획 (backoffice/, client/ 등)
│
├── scripts/               # 자동화·유틸 스크립트
│   ├── db_reset.py        # DB 전체 리셋 (DROP 후 재생성)
│   └── deploy.sh         # 배포 자동화
│
├── shared/                # 앱 간 재사용 리소스
│   ├── ui-kit/            # 공통 디자인 컴포넌트
│   │   ├── components/
│   │   └── design-guide.md
│   └── utils/             # 공통 유틸 (날짜 포맷 등)
│       └── date.js        # formatDate(iso, options) — client·backoffice 공용
│
└── apps/
    ├── api/               # (Backend) REST API 서버
    │   ├── core/          # 설정, DB 연결, 보안
    │   ├── routers/       # API 엔드포인트
    │   └── main.py        # 진입점
    │
    ├── client/            # (Frontend) 방문자용 블로그/포트폴리오
    │   ├── pages/
    │   └── public/
    │
    └── backoffice/        # (Frontend) 관리자용 어드민
        ├── components/   # AdminLayout 등
        ├── pages/        # 대시보드, 포스트(목록/에디터/상세/카테고리), 경력, 프로젝트, 메시지, 알림
        ├── styles/       # AdminTheme.js (MUI·다크 모드)
        └── utils/
```

## 폴더별 역할

- **루트**: `requirements.txt`, `.venv` 로 API·스크립트 공통 환경.
- **docs**: 스펙 확인 시 `docs/guides/`(common, backoffice, client, deploy, convention), 구현 계획은 `docs/plans/` 참고.
- **scripts**: `python scripts/db_reset.py` 등. (관리자 계정은 서버 기동 시 `apps/api/core/db_init.py`에서 없을 때만 자동 생성)
- **shared/ui-kit**: Button, Card, Modal, Layout 등; client·backoffice 에서 import.
- **shared/utils**: 공통 유틸(예: `date.js`의 `formatDate`). client·backoffice에서 상대 경로로 import. 포맷 정책 변경 시 한 곳만 수정.
- **apps/api**: FastAPI 앱, DB 접근, 인증.
- **apps/client**: 읽기 위주 블로그/About/프로젝트.
- **apps/backoffice**: 글/경력/프로젝트/카테고리/메시지/에디터 관리. 레이아웃·테마는 `components/AdminLayout.jsx`, `styles/AdminTheme.js`, [10-backoffice-ui-guide.md](10-backoffice-ui-guide.md) 참고.

## 개발 워크플로우

1. 문서 작성 (docs) → 기능 스펙을 md 로 정리.
2. DB/스크립트 (scripts) → 스키마 변경 시 `db_reset.py` 등 업데이트.
3. 디자인 컴포넌트 (shared/ui-kit) → 공통 UI 먼저 제작.
4. API 개발 (apps/api) → 엔드포인트 구현.
5. 앱 조립 (apps/client, apps/backoffice) → API·UI 연결.
