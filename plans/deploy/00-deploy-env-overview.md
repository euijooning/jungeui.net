# 배포 환경 분리 (ENV) 개요

## 목표

- **ENV** 환경변수로 운영(production)과 스테이징(staging)을 구분한다.
- 앱 시작 시 `.env` 또는 `.env.staging` **한 개만** 로드하여 해당 환경 설정만 사용한다.
- (systemd 등에서 `Environment=ENV=...` 로 지정하는 것은 나중에 직접 작성.)

## ENV 규칙

| ENV 값 | 로드 파일 | 용도 |
|--------|-----------|------|
| `production` 또는 미설정 | `.env` | 운영·로컬 기본 |
| `staging` | `.env.staging` | 스테이징(로그/테스트용) |

그 외 값은 모두 `.env`를 사용(기본값 production으로 간주).

## 로딩 방식

- API 앱: `apps/api/core/config.py`에서 `os.getenv("ENV", "production").strip().lower()`로 ENV를 읽고, `env == "staging"`이면 `.env.staging`, 아니면 `.env`를 `load_dotenv()`로 한 번만 로드한다.
- 스크립트(scripts): 현재는 CWD 기준 `.env`만 로드. 스테이징 DB를 쓰려면 프로젝트 루트에서 `ENV=staging`으로 실행하거나, 나중에 공통 헬퍼로 ENV 기반 로드를 적용할 수 있다.

## 문서

- [phase-01-env-file-and-config.md](phase-01-env-file-and-config.md) — .env.staging + config ENV 분기
- [phase-03-documentation.md](phase-03-documentation.md) — 서버 가이드·README 반영
