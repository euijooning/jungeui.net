# 프로젝트 폴더 구조 (Monorepo)

## 원칙

- **Single Source of Truth**: Python 의존성은 루트 `requirements.txt` 하나로 관리.
- **Docs First**: 구현 가이드·스펙은 `docs/` 에 `.md` 로 우선 작성.
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
├── docs/                  # 구현 가이드 및 명세서 (.md)
│   ├── common/            # 공통 명세 (01-db-schema, 02-api-spec, 03~06)
│   ├── backoffice/        # 백오피스 가이드 (01-implementation-guide ~ 06-phase-checklist)
│   ├── client/            # 클라이언트 가이드 (01-implementation-guide ~ 07-project-card-layout)
│   └── convention/        # 코딩 컨벤션, 커밋 메시지 규칙 등
│
├── scripts/               # 자동화·유틸 스크립트
│   ├── db_reset.py        # DB 전체 리셋 (DROP 후 재생성)
│   └── deploy.sh         # 배포 자동화
│
├── shared/                # 앱 간 재사용 리소스
│   └── ui-kit/            # 공통 디자인 컴포넌트
│       ├── components/
│       └── design-guide.md
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
        ├── pages/         # 대시보드, 글쓰기 에디터, 경력/프로젝트, assets
        └── utils/
```

## 폴더별 역할

- **루트**: `requirements.txt`, `.venv` 로 API·스크립트 공통 환경.
- **docs**: 스펙 확인 시 코드보다 `docs/` 참고. `common/`(DB·API·폴더구조·디자인·UI 가이드), `backoffice/`(Phase별 구현 가이드), `client/`(Phase별 구현 가이드).
- **scripts**: `python scripts/db_reset.py` 등. (관리자 계정은 서버 기동 시 `apps/api/core/db_init.py`에서 없을 때만 자동 생성)
- **shared/ui-kit**: Button, Card, Modal, Layout 등; client·backoffice 에서 import.
- **apps/api**: FastAPI 앱, DB 접근, 인증.
- **apps/client**: 읽기 위주 블로그/About/프로젝트.
- **apps/backoffice**: 글/경력/프로젝트/에디터/assets 관리.

## 개발 워크플로우

1. 문서 작성 (docs) → 기능 스펙을 md 로 정리.
2. DB/스크립트 (scripts) → 스키마 변경 시 `db_reset.py` 등 업데이트.
3. 디자인 컴포넌트 (shared/ui-kit) → 공통 UI 먼저 제작.
4. API 개발 (apps/api) → 엔드포인트 구현.
5. 앱 조립 (apps/client, apps/backoffice) → API·UI 연결.
