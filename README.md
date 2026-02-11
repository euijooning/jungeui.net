# JUNGEUI LAB

브랜딩 개인 채널.  
기획자 블로그 + 포트폴리오 소개 + 커스텀 백오피스.

## 구조 (Monorepo)

- **docs/** — 구현 가이드·스펙 (DB 스키마, API 명세, 폴더 구조)
- **scripts/** — DB 초기화, 시딩, 배포 스크립트
- **shared/ui-kit/** — 클라이언트·백오피스 공통 UI 컴포넌트
- **apps/api/** — Python FastAPI REST API 서버
- **apps/client/** — 방문자용 블로그/포트폴리오 프론트
- **apps/backoffice/** — 관리자용 어드민 (글/경력/프로젝트/에디터, assets)

## 문서

환경별 .env 및 배포 구조는 [docs/common/07-deploy-strategy.md](docs/common/07-deploy-strategy.md) 참고.

**공통 (docs/common/)**  
- [01-db-schema.md](docs/common/01-db-schema.md) — DB 테이블 정의
- [02-api-spec.md](docs/common/02-api-spec.md) — API 명세
- [03-folder-structure.md](docs/common/03-folder-structure.md) — 폴더 구조 상세
- [04-design-guide.md](docs/common/04-design-guide.md) — 디자인 가이드
- [05-server-run-guide.md](docs/common/05-server-run-guide.md) — 서버 실행·환경 변수(운영/스테이징)
- [06-ui-ux-guide.md](docs/common/06-ui-ux-guide.md) — UI/UX 가이드
- [07-deploy-strategy.md](docs/common/07-deploy-strategy.md) — 배포 전략 (ENV·.env, 운영/스테이징)

**기타**  
- [docs/deploy/](docs/deploy/00-deploy-index.md) — 배포 매뉴얼 (systemd, Nginx Basic Auth)
- [docs/backoffice/](docs/backoffice/) — 백오피스 가이드
- [docs/convention/](docs/convention/) — 컨벤션

**구현 계획 (plans/)**  
- [plans/backoffice/](plans/backoffice/00-backoffice-implementation-guide.md) — 백오피스 (레이아웃·포스트·카테고리·메시지·프로젝트·경력)
- [plans/client/](plans/client/) — 클라이언트 Phase
