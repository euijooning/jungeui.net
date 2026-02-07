# Phase 01: .env.staging 생성 + config ENV 분기

## 1. .env.staging 파일

- 위치: 프로젝트 루트.
- `.env`와 동일한 키 구조, 스테이징 전용 값:
  - **포트**: API 8011, 백오피스 5183, 클라이언트 5184.
  - **MYSQL_DATABASE**: `jungeuilab-log`.
  - **CORS_ORIGINS**: `https://logadmin.jungeui.net,https://log.jungeui.net`.
  - **VITE_***: `VITE_API_URL`, `VITE_BACKOFFICE_PORT`, `VITE_CLIENT_PORT`, `VITE_BACKOFFICE_URL`, `VITE_CLIENT_URL` — 스테이징 포트(8011, 5183, 5184)로 설정.
- DB 비밀번호·시드·SECRET_KEY 등은 서버/로컬에서만 채우거나, 운영과 다른 스테이징 전용 값 사용.

## 2. config.py 수정

- 파일: `apps/api/core/config.py`.
- 상단에서 ENV 읽기: `_env = os.getenv("ENV", "production").strip().lower()`.
- `_env == "staging"`이면 `_env_file = ".env.staging"`, 아니면 `_env_file = ".env"`.
- `load_dotenv(_env_path / _env_file)` 한 번만 호출.
- 기존 `os.getenv()` 호출은 그대로 유지.

## 3. 스크립트(scripts)

- Phase 01 범위에서는 수정하지 않음.
- 스크립트도 ENV 기반으로 쓰려면: 프로젝트 루트에서 `ENV=staging python scripts/xxx.py` 실행 시, 현재는 CWD의 `.env`만 로드되므로, 동일 규칙을 쓰려면 나중에 공통 헬퍼(ENV에 따라 루트의 `.env`/`.env.staging` 로드)를 두고 각 스크립트에서 사용하면 된다.
