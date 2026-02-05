# Jungeui Lab

사고 과정(Process)과 결과물(Output)을 보여주는 브랜딩 채널.  
기술 블로그 + 포트폴리오(경력/프로젝트) + 커스텀 백오피스.

## 구조 (Monorepo)

- **docs/** — 구현 가이드·스펙 (DB 스키마, API 명세, 폴더 구조)
- **scripts/** — DB 초기화, 시딩, 배포 스크립트
- **shared/ui-kit/** — 클라이언트·백오피스 공통 UI 컴포넌트
- **apps/api/** — Python FastAPI REST API 서버
- **apps/client/** — 방문자용 블로그/포트폴리오 프론트
- **apps/backoffice/** — 관리자용 어드민 (글/경력/프로젝트/에디터, assets)

## 문서

- [01-db-schema.md](docs/01-db-schema.md) — DB 테이블 정의
- [02-api-spec.md](docs/02-api-spec.md) — API 명세
- [03-folder-structure.md](docs/03-folder-structure.md) — 폴더 구조 상세
- [plans/backoffice-make/](plans/backoffice-make/) — 백오피스 구현 가이드 (Phase 01 완료)
