# 서버 실행 가이드

로컬에서 API·백오피스·클라이언트를 실행하고 빌드하는 방법을 정리한 문서입니다.  
API 명세는 [02-api-spec.md](02-api-spec.md)를 참조하세요.

---

## 1. 필요 환경

- **Node.js** · **npm** — 백오피스·클라이언트 개발/빌드
- **Python 3.x** · **가상환경** — API 서버
- **루트 `.env`** — DB·API URL·포트 등(선택: MySQL 사용 시 필수)

환경변수는 프로젝트 루트의 `.env`에서 로드됩니다. Vite 앱(백오피스·클라이언트)은 `envDir`로 루트를 사용합니다.  
운영: `ENV=production`(또는 생략), 스테이징: `ENV=staging`. systemd에서는 `Environment=`로 설정.  
**운영·스테이징**에서는 `SECRET_KEY`가 필수이며, 미설정 시 API가 기동하지 않습니다. [07-deploy-strategy.md](07-deploy-strategy.md), [09-security-and-shared-config.md](09-security-and-shared-config.md) 참고.

---

## 2. API 서버 (FastAPI)

- **작업 디렉터리**: 프로젝트 루트 (`jungeui/`)

**의존성 설치**

```bash
# 가상환경 활성화 후 (Windows PowerShell 예시)
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**개발 서버 실행 (코드 변경 시 자동 리로드)**

반드시 **프로젝트 루트**에서 실행해야 합니다. `apps\api` 등 하위 폴더에서 실행하면 `ModuleNotFoundError: No module named 'apps'`가 납니다.

```bash
# 프로젝트 루트로 이동 후 (예: jungeui.net 루트)
uvicorn apps.api.main:app --reload --port 8010
```

- `--host 0.0.0.0`을 붙이면 같은 LAN의 다른 기기에서도 접속 가능(배포·다른 기기 테스트 시 유용). 로컬에서만 쓸 때는 생략해도 되며, 생략 시 기본값 `127.0.0.1`로 같은 PC에서만 접속됩니다.
- API 베이스 URL: `http://localhost:8010`
- 포트를 바꾸려면 `--port` 값을 변경하면 됩니다. 프론트에서 사용하는 `VITE_API_URL`도 같은 포트로 맞춰 주세요.
- DB 초기화 시 경력 확장 테이블(career_links, career_highlights, career_tags)이 없으면 서버 기동 시 자동 생성된다. [01-db-schema.md](01-db-schema.md) 참고.

---

## 3. 백오피스 (React Admin)

- **작업 디렉터리**: `apps/backoffice/`

**의존성 설치**

```bash
cd apps/backoffice
npm install
```

**개발 서버**

```bash
npm run dev
```

- 기본 포트: **5181** (`VITE_BACKOFFICE_PORT`로 변경 가능)
- API 연동: 루트 `.env`의 `VITE_API_URL`(예: `http://localhost:8010`) 사용. 백오피스 Vite 프록시가 `/api`를 해당 URL로 넘깁니다.

**프로덕션 빌드**

```bash
npm run build
```

---

## 4. 클라이언트 (블로그/포트폴리오)

- **작업 디렉터리**: `apps/client/`

**의존성 설치**

```bash
cd apps/client
npm install
```

**개발 서버**

```bash
npm run dev
```

- 기본 포트: **5182** (`VITE_CLIENT_PORT`로 변경 가능)

**프로덕션 빌드**

```bash
npm run build
```

---

## 5. 동시 실행 요약

로컬에서 전부 켜 두고 사용하려면 터미널을 3개 띄워 각각 실행하면 됩니다.

| 터미널 | 위치 | 명령 |
|--------|------|------|
| 1 | 프로젝트 루트 | `uvicorn apps.api.main:app --reload --port 8010` |
| 2 | `apps/backoffice` | `npm run dev` |
| 3 | `apps/client` | `npm run dev` |

- API: http://localhost:8010  
- 백오피스: http://localhost:5181  
- 클라이언트: http://localhost:5182  

한 번에 실행하려면 루트에 `package.json`을 두고 `concurrently` 등으로 스크립트를 묶는 방식으로 확장할 수 있습니다.

**참고 문서**: [07-deploy-strategy.md](07-deploy-strategy.md)(ENV·.env·배포), [09-security-and-shared-config.md](09-security-and-shared-config.md)(SECRET_KEY·API 단일 소스·공통 유틸).
