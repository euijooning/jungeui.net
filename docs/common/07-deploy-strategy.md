# 배포 전략 (ENV·.env 기준)

**범위**: 운영(production)과 스테이징(staging) 환경 분리, 서버 배포 구조, 배포 시 절차.

**관련**: 서버 실행·로컬 실행 상세는 [05-server-run-guide.md](05-server-run-guide.md) 참조.

---

## 1. 서버 배포 구조: 디렉터리 두 개 (권장)

서버에는 **운영용 디렉터리**와 **스테이징용 디렉터리**를 각각 둔다.

| 용도 | 디렉터리 예 | systemd ENV |
|------|-------------|-------------|
| 운영 | 예: `~/connect/jungeui` | `ENV=production` → 해당 디렉터리의 `.env` 로드 |
| 스테이징 | 예: `~/connect/jungeui-dev` | `ENV=staging` → 해당 디렉터리의 `.env.staging` 로드 |

- 각 서비스의 **WorkingDirectory**를 해당 디렉터리로 두고, **Environment=ENV=production** 또는 **Environment=ENV=staging**만 지정하면 된다.
- **상대 경로**(`UPLOAD_DIR=uploads` 등)는 디렉터리별로 해석되므로, 운영과 스테이징의 업로드·로그 등이 섞이지 않는다. 한 디렉터리만 쓰면 두 환경이 같은 `uploads/`를 바라보게 되어 꼬이므로, 디렉터리를 나누는 방식을 권장한다.

---

## 2. ENV 규칙 (공통)

- **ENV** 환경변수로 운영과 스테이징을 구분한다.
- 앱 시작 시 해당 디렉터리 루트의 `.env` 또는 `.env.staging` **한 개만** 로드한다.

| ENV 값 | 로드 파일 | 용도 |
|--------|-----------|------|
| `production` 또는 미설정 | `.env` | 운영·로컬 기본 |
| `staging` | `.env.staging` | 스테이징(로그/테스트용) |

그 외 값은 `.env` 사용(production으로 간주).

---

## 3. 로딩 방식 (공통)

### API

**파일**: [../../apps/api/core/config.py](../../apps/api/core/config.py)

- `ENV = os.getenv("ENV", "production").strip().lower()`로 ENV를 읽는다.
- `_env == "staging"`이면 `.env.staging`, 아니면 `.env`를 사용.
- 루트 경로는 `Path(__file__).resolve().parents[3]`(해당 프로젝트 루트) 기준.
- `load_dotenv(루트 경로 / 파일명)`을 **한 번만** 호출한 뒤 `os.getenv()`로 설정을 읽는다.

### 스크립트 (scripts)

**파일**: [../../scripts/db_init.py](../../scripts/db_init.py), [../../scripts/seed_data.py](../../scripts/seed_data.py)

- 현재는 CWD 기준 `.env`만 로드하며 ENV를 읽지 않는다.
- 스테이징 DB를 쓰려면 해당 스테이징 디렉터리에서 실행하거나, 추후 ENV에 따라 `.env`/`.env.staging`을 로드하는 공통 헬퍼를 적용할 수 있다.

---

## 4. .env / .env.staging 파일 구조 (공통)

각 디렉터리 루트에 두 파일은 **같은 키 구조**로 두고, 환경별로 값만 다르게 둔다.

### 공통 키 목록 (역할)

| 키 | 역할 |
|----|------|
| `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` | DB 접속 |
| `SECRET_KEY` | JWT·세션 등 API 비밀키 |
| `CORS_ORIGINS` | 허용 출처(쉼표 구분) |
| `UPLOAD_DIR` | 업로드 디렉터리(기본 `uploads`, 상대 경로면 해당 디렉터리 기준) |
| `REDIRECT_WWW_TO_NAKED`, `WWW_HOST`, `NAKED_HOST` | www → naked 리다이렉트(선택) |
| `VITE_API_URL`, `VITE_BACKOFFICE_PORT`, `VITE_CLIENT_PORT` | 프론트 API URL·포트 |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME` | 시드 스크립트용 |

비밀값은 문서에 기입하지 않고, 서버·로컬에서만 채운다.

### 스테이징 예시 (값 참고용)

- **포트**: API 8011, 백오피스 5184, 클라이언트 5183.
- **DB**: `MYSQL_DATABASE=jungeui-log` 등 스테이징 전용 DB명.
- **CORS**: 스테이징 도메인만 포함.
- **VITE_***: 스테이징 포트·URL에 맞게 설정.

---

## 5. 배포 시 절차

### 5-1. 전체 배포 (코드 + 빌드 + .env)

**언제**: 새 버전 배포, 코드·빌드·설정을 한꺼번에 반영할 때.

1. **운영 디렉터리**: 클론/풀 또는 빌드 산출물 배치 후, 해당 루트에 **.env** 배치(덮어쓰기). systemd는 `WorkingDirectory=운영 디렉터리`, `Environment=ENV=production`.
2. **스테이징 디렉터리**: 동일하게 코드·빌드 반영 후, 해당 루트에 **.env.staging** 배치. systemd는 `WorkingDirectory=스테이징 디렉터리`, `Environment=ENV=staging`.
3. 필요 시 서비스 재시작.

### 5-2. .env만 배포 (설정만 갱신)

**언제**: 코드/빌드는 그대로 두고, 환경변수만 바꿀 때.

1. 변경할 환경에 해당하는 **디렉터리**의 루트에 **.env**(운영) 또는 **.env.staging**(스테이징) **한 개만** 배치(덮어쓰기).
2. 해당 서비스만 재시작하면 새 설정이 적용된다.

### 보안

- `.env`, `.env.staging`은 버전 관리 제외(.gitignore). 실제 값은 배포 채널(보안 전달)로만 공유한다.

---

## 6. 문서·README 연계

- **서버 실행·로컬 실행**: [05-server-run-guide.md](05-server-run-guide.md) 참조.
- **루트 README**: 배포/환경 문단이 있으면 "환경별 .env 및 배포 구조는 docs/common/07-deploy-strategy.md 참고"로 안내하면 된다.
