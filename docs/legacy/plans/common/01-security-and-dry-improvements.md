# 공통 개선: 보안 필수 + API/날짜 통합 (DRY)

보안 필수 1건 + 유지보수 DRY 통합 3건. **실행 순서**: Phase 1 → 2 → 3 → 4.

**원칙**: 항상 가장 중요한 것은 **코드의 일관성 준수**이다. 새 코드·리팩터는 기존 패턴·명명·구조와 맞춘다.

---

## 채팅/세션 변경 시 백업 수단

- **Phase 단위 커밋**: 각 Phase 완료 후 `git add` + `git commit`으로 상태 보존. 채팅이 바뀌어도 해당 커밋까지 복원 가능.
- **브랜치**: 이 계획 작업은 별도 브랜치(예: `plan/common-01-security-dry`)에서 진행하면, main/staging과 분리된 백업이 됨.
- **문서 동기화**: `docs/plans/common/01-security-and-dry-improvements.md`의 체크리스트를 진행 상황에 맞게 갱신해 두면, 다음 세션에서 이어서 진행 가능.
- **롤백**: Phase 단위로 커밋해 두었으면 `git revert` 또는 해당 Phase 이전 커밋으로 되돌리기 가능.

---

## Phase 1. SECRET_KEY 기본값 제거 / production 시 검증 강제 (보안 필수)

**파일**: `apps/api/core/config.py`  
**현재**: `SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-production")`  
**위험**: ENV=production인데 SECRET_KEY 누락 시 그대로 기동·배포 가능. 동일 기본 키 다중 인스턴스 시 토큰/세션/서명 무력화.

### 체크리스트

- [x] production(또는 staging)일 때 `SECRET_KEY` 미설정이면 기동 시 에러 발생하도록 수정
- [x] 기본값 제거 (개발 전용 기본값 허용 여부는 팀 정책에 따라 결정) — 개발(ENV≠production,staging)일 때만 기존 기본값 유지
- [x] 배포 문서(`docs/guides/common/07-deploy-strategy.md` 등)에 `SECRET_KEY` 필수 명시

### 수정 방향 (참고)

- `_env == "production"`(또는 `"staging"`)일 때: `SECRET_KEY = os.getenv("SECRET_KEY")` 로 읽고, 비어 있거나 없으면 `raise SystemExit("SECRET_KEY must be set when ENV=production")` 또는 ValueError 후 종료.
- 개발(예: `ENV=development` 또는 미설정)일 때만 기본값 허용할지, 항상 env 필수로 할지는 팀 정책.

---

## Phase 2. API_BASE / API URL 통합 (backoffice 단일 소스)

**현재**: backoffice에서 `API_BASE`/`apiBase`/`(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')` 를 여러 파일에서 각각 정의.  
**대상 파일**: apiClient.js, authProvider.js, dataProvider.js, PostDetail.jsx, PostEditor.jsx, ProjectForm.jsx, ProjectDetailModal.jsx, CareerForm.jsx.  
**목표**: backoffice는 `apiClient` 하나에서만 API 베이스 사용. client는 `config.js` 유지.  
**구현 참고**: 순환 의존성(apiClient ↔ authProvider) 회피를 위해 `lib/apiConfig.js`에 API_BASE·isDev 단일 정의, apiClient가 사용·재export, authProvider만 apiConfig에서 직접 import.

### 체크리스트

- [x] `apiClient.js`에서 `API_BASE`(또는 `getApiBase()`) export
- [x] 필요 시 `apiClient.js`에서 `isDev` export (상대/절대 URL 판단용)
- [x] `authProvider.js`: 상단 `const API_BASE = ...` 제거 후 apiConfig에서 import
- [x] `dataProvider.js`: 상단 `const apiBase = ...` 제거 후 apiClient에서 import
- [x] `PostDetail.jsx`: 상단 `apiBase`/`isDev` 로컬 정의 제거 후 apiClient에서 import
- [x] `PostEditor.jsx`: 상단 `apiBase` 로컬 정의 제거 후 apiClient에서 import
- [x] `ProjectForm.jsx`: 상단 `const API_BASE = ...` 제거 후 apiClient에서 import
- [x] `ProjectDetailModal.jsx`: 상단 `const API_BASE = ...` 제거 후 apiClient에서 import
- [x] `CareerForm.jsx`: 상단 `const API_BASE = ...` 제거 후 apiClient에서 import

### 수정 방향 (참고)

- `resolveUrl(path)` 등 기존 apiClient 동작 유지. 다른 backoffice 코드는 베이스/URL 해석을 apiClient에서만 가져다 쓰도록 통일.

---

## Phase 3. 업로드 URL 통합

**현재**: `UPLOAD_URL` 또는 `API_BASE ? \`${API_BASE}/api/assets/upload\` : '/api/assets/upload'` 를 PostEditor, ProjectForm, CareerForm에서 각각 정의.  
**목표**: 업로드 URL 한 곳만 정의 (Phase 2 API_BASE 통합과 세트).

### 체크리스트

- [x] `apiClient.js`(또는 backoffice config)에 `getUploadUrl()` 또는 `UPLOAD_URL` 상수 추가 — `apiConfig.js`에 정의 후 apiClient에서 재export
- [x] `PostEditor.jsx`: 업로드 URL 로컬 정의 제거 후 apiClient에서 `UPLOAD_URL` import (이미지·첨부 업로드 모두 동일 URL 사용)
- [x] `ProjectForm.jsx`: `UPLOAD_URL` 로컬 정의 제거 후 apiClient에서 import
- [x] `CareerForm.jsx`: `UPLOAD_URL` 로컬 정의 제거 후 apiClient에서 import

### 수정 방향 (참고)

- 로직: `API_BASE ? \`${API_BASE}/api/assets/upload\` : '/api/assets/upload'` 를 apiConfig 한 곳에서만 작성.

---

## Phase 4. formatDate 통합

**현재**: `formatDate(iso)` 또는 `toLocaleDateString('ko-KR', ...)` 가 client·backoffice 여러 파일에 로컬 함수로 중복 (Home, PostDetail, PostList, NotificationsPage, Dashboard 등).  
**목표**: 공통 유틸 한 곳에서 `formatDate` 제공. 포맷/로케일 변경 시 한 곳만 수정.

### 체크리스트

- [x] 공통 유틸 파일 추가: `shared/utils/date.js` (client·backoffice 둘 다 사용)
- [x] `formatDate(iso, options?)` 함수 정의 (dateStyle: 'short', withTime, format: 'dot', monthShortWithTime 등 옵션)
- [x] client `Home.jsx`: 로컬 `formatDate` 제거 후 공통 유틸 import
- [x] client `PostDetail.jsx`: 로컬 `formatDate` 제거 후 공통 유틸 import (`format: 'dot'`)
- [x] backoffice `PostList.jsx`: 로컬 `formatDate` 제거 후 공통 유틸 import (`dateStyle: 'short'`)
- [x] backoffice `PostDetail.jsx`: 로컬 `formatDate` 제거 후 공통 유틸 import (`withTime: true`)
- [x] backoffice `NotificationsPage.jsx`: 로컬 `formatDate` 제거 후 공통 유틸 import (`monthShortWithTime: true`)
- [x] backoffice `Dashboard.jsx`: 날짜 표시 부분 공통 유틸로 교체 (기본 포맷)

### 수정 방향 (참고)

- 기존 사용처 중 `year/month/day` 등 세부 옵션 쓰는 곳이 있으면 `formatDate(iso, options?)` 로 흡수.

---

## 관련 문서

- 배포·환경 변수: `docs/guides/common/07-deploy-strategy.md`
- API 명세: `docs/guides/common/02-api-spec.md`
- 폴더 구조: `docs/guides/common/03-folder-structure.md`
