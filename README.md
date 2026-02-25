# JUNGEUI LAB

브랜딩 개인 채널.  
기획자 블로그 + 포트폴리오 소개 + 커스텀 백오피스.

## 구조 (Monorepo)

- **docs/** — 문서 루트: `guides/`(구현 가이드·스펙), `plans/`(구현 계획)
- **scripts/** — DB 초기화, 시딩, 배포 스크립트
- **shared/** — 클라이언트·백오피스 공통: `ui-kit/`(UI 컴포넌트), `utils/`(예: 날짜 포맷)
- **apps/api/** — Python FastAPI REST API 서버
- **apps/client/** — 방문자용 블로그/포트폴리오 프론트
- **apps/backoffice/** — 관리자용 어드민 (MUI·다크 모드, 글/경력/프로젝트/카테고리/메시지, Toast UI 에디터)

## 문서

환경별 .env 및 배포 구조는 [docs/guides/common/07-deploy-strategy.md](docs/guides/common/07-deploy-strategy.md) 참고.

**공통 (docs/guides/common/)**  
- [01-db-schema.md](docs/guides/common/01-db-schema.md) — DB 테이블 정의
- [02-api-spec.md](docs/guides/common/02-api-spec.md) — API 명세
- [03-folder-structure.md](docs/guides/common/03-folder-structure.md) — 폴더 구조 상세
- [04-design-guide.md](docs/guides/common/04-design-guide.md) — 디자인 가이드
- [05-server-run-guide.md](docs/guides/common/05-server-run-guide.md) — 서버 실행·환경 변수(운영/스테이징)
- [06-ui-ux-guide.md](docs/guides/common/06-ui-ux-guide.md) — UI/UX 가이드
- [07-deploy-strategy.md](docs/guides/common/07-deploy-strategy.md) — 배포 전략 (ENV·.env, 운영/스테이징)
- [09-security-and-shared-config.md](docs/guides/common/09-security-and-shared-config.md) — 보안(SECRET_KEY)·API 단일 소스·공통 유틸(날짜)

**백오피스 (docs/guides/backoffice/)**  
- [01-implementation-guide.md](docs/guides/backoffice/01-implementation-guide.md) — 구현 가이드
- [10-backoffice-ui-guide.md](docs/guides/common/10-backoffice-ui-guide.md) — 백오피스 UI 총체 (테마·다크·폰트·사이드바·로그인)

**기타**  
- [docs/guides/deploy/](docs/guides/deploy/00-deploy-index.md) — 배포 매뉴얼 (systemd, Nginx Basic Auth)
- [docs/guides/convention/](docs/guides/convention/) — 컨벤션

**구현 계획 (docs/plans/)**  
- [docs/plans/backoffice/](docs/plans/backoffice/00-backoffice-implementation-guide.md) — 백오피스 (레이아웃·포스트·카테고리·메시지·프로젝트·경력·다크 모드)
- [docs/plans/client/](docs/plans/client/) — 클라이언트 Phase
