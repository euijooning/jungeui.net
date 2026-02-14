# 보안·환경·공통 설정 요약

API 보안 필수 항목, 백오피스 API 단일 소스, 공통 유틸 위치를 정리한 문서.  
구현 계획 상세는 [docs/plans/common/01-security-and-dry-improvements.md](../../plans/common/01-security-and-dry-improvements.md) 참고.

---

## 1. API 보안·환경 (apps/api/core/config.py)

- **SECRET_KEY**: `ENV=production` 또는 `ENV=staging`일 때 **필수**. 미설정 시 기동 시점에 `SystemExit`로 종료. 개발(그 외 ENV)일 때만 기본값 허용.
- **DB 비밀번호**: `MYSQL_PASSWORD`에 특수문자(`@`, `#`, `/` 등)가 있으면 connection string 파싱이 깨지므로, `urllib.parse.quote_plus(MYSQL_PASSWORD)`로 인코딩 후 `DATABASE_URL`에 사용.
- **환경 로드**: 루트 `.env` / `.env.staging` — `parents[3]` = 프로젝트 루트. `load_dotenv`는 이미 설정된 시스템 환경변수를 덮어쓰지 않음(배포 설정 우선).

배포 시 필수 키는 [07-deploy-strategy.md](07-deploy-strategy.md)의 .env 구조 참고.

---

## 2. 백오피스 API URL 단일 소스

백오피스에서 `VITE_API_URL` 기반 URL은 **한 곳에서만 정의**하고, 나머지는 import만 사용.

| 파일 | 역할 |
|------|------|
| `apps/backoffice/src/lib/apiConfig.js` | `API_BASE`, `isDev`, `UPLOAD_URL` 정의. 순환 의존성 회피용으로 authProvider만 여기서 직접 import. |
| `apps/backoffice/src/lib/apiClient.js` | apiConfig에서 위 값 사용·재export. `resolveUrl`, `request`, `upload` 등 HTTP 클라이언트 제공. |

- **authProvider.js**: `API_BASE`는 **apiConfig**에서만 import (apiClient import 시 순환 발생).
- **dataProvider.js**, **PostDetail**, **PostEditor**, **ProjectForm**, **ProjectDetailModal**, **CareerForm**: `API_BASE`, `isDev`, `UPLOAD_URL` 등은 **apiClient**에서 import.

URL/프록시/스테이징 정책 변경 시 `apiConfig.js` 한 파일만 수정하면 됨.

---

## 3. 클라이언트 API 설정

- **파일**: `apps/client/src/config.js`
- **내용**: `VITE_API_URL`, `VITE_CONTACT_EMAIL`, `VITE_UTTERANCES_REPO` 등 export. API 호출·정적 URL은 이 설정과 `api.js`의 `request`/`getStaticUrl` 사용.

---

## 4. 공통 날짜 포맷 (shared/utils/date.js)

- **위치**: `shared/utils/date.js`
- **함수**: `formatDate(iso, options?)` — 무효 입력 시 `''` 반환.
- **옵션**: `dateStyle: 'short'` | `withTime: true`(yyyy-mm-dd hh:mm) | `format: 'dot'`(y.m.d) | `monthShortWithTime: true`(월 짧은 이름 + 시분). 기본은 날짜만 `ko-KR`.
- **사용처**: client(Home, PostDetail), backoffice(PostList, PostDetail, NotificationsPage, Dashboard). 각 앱에서 상대 경로로 `shared/utils/date` import.

로케일/포맷 정책 변경 시 이 파일만 수정.

---

## 관련 문서

- [07-deploy-strategy.md](07-deploy-strategy.md) — ENV, .env 구조, SECRET_KEY 필수
- [05-server-run-guide.md](05-server-run-guide.md) — 로컬 실행·환경변수
- [03-folder-structure.md](03-folder-structure.md) — shared/utils 역할
- [../../plans/common/01-security-and-dry-improvements.md](../../plans/common/01-security-and-dry-improvements.md) — Phase별 체크리스트·수정 방향
