# Projects 페이지 그리드 개편 및 백오피스 프로젝트 관리 재추가

클라이언트의 Projects 페이지를 **Posts 페이지와 동일한 컨테이너 너비**로 바꾸고, 그 안에 **네모(카드) 컨테이너 2개씩** 그리드로 배치. 백오피스는 **다른 페이지와 동일한 리스트 형태**(이미지 없음)로 관리.

---

## 1. 클라이언트 Projects 페이지 변경

### 1-1. 제거 (Cleanup)

- **경력(Career) 관련 로직 전면 삭제**: `CareerModal` 컴포넌트 및 버튼 삭제. `careers`, `fetchCareers`, `sortCareersByPeriodDesc` 등 관련 State/API 호출 제거.
- **캐러셀(Carousel) UI 제거**: 이전/다음 버튼, 인디케이터, 리사이즈 옵저버 등 관련 코드 제거. 기존 와이드(`max-w-[1500px]` 등) 사용 영역 제거.

### 1-2. 컨테이너 너비 (Posts와 동일)

- **태그/프로젝트 구역의 배경색**은 뷰포트 전체 폭을 채우고 (샘플과 동일: `relative left-1/2 -translate-x-1/2 w-screen`), **내부 콘텐츠**(제목·태그 링크·프로젝트 그리드)만 **`max-w-[1200px] mx-auto px-4 md:px-6`** 로 제한.
- 태그 폭 = 프로젝트 폭(동일 내부 컨테이너). 프로젝트 영역 내부는 2열 그리드로 카드 배치.

### 1-3. 페이지 구성 순서

1. **태그 섹션**: 최상단 유지 (`fetchTags` 사용).
2. **프로젝트 섹션**: 제목 "프로젝트", 소개 문구는 기존 `projectsCareersIntro` API 재사용하여 제목 아래 한 줄로 표시.

### 1-4. 프로젝트 카드 — 네모 컨테이너 (샘플 이미지 기준)

- **배치**: 위 컨테이너 안에서 Desktop **2열 그리드**(한 행에 카드 2개), Mobile 1열(Stack). 카드 크기는 이 너비에 맞춰 조정.
- **카드 구조 (하나의 사각형 컨테이너)**:
  1. **16:9 대표 이미지**: 상단 16:9 비율 직사각형. 없으면 Placeholder.
  2. **로고 / 핀**: 로고 이미지가 있으면 **작은 정사각형**으로 표시, 없으면 **핀(pin) 아이콘 디폴트 이미지** 사용.
  3. **프로젝트 제목**: (최대 20자)
  4. **진행일**: `yyyy.mm ~ yyyy.mm` 또는 `yyyy.mm ~ 진행중` (종료일 없을 때)
  5. **프로젝트 태그**: 선택 기능 없음, **출력만** (최대 7개)
  6. **한 줄 소개**: `description` (최대 20자, 말줄임)
- **인터랙션**: **네모 컨테이너 전체 클릭** 시 입력한 **노션 링크(`notion_url`)** 가 **새 창**에서 열림 (`target="_blank"`).

### 1-5. 데이터 & API

- 유지: `fetchTags`, `fetchProjects`, `fetchProjectsCareersIntro`.
- `fetchProjects` 응답에 `notion_url`, `logo`(로고 이미지 URL) 등 포함 필요.

---

## 2. 백오피스: 프로젝트 관리 재추가

### 2-1. 메뉴 및 라우팅

- **AdminLayout**: "포트폴리오 관리" 하위에 "프로젝트" 메뉴 추가. Path `/projects`, Icon `FolderKanban` or `LayoutGrid`.
- **App.jsx**: `/projects`(목록), `/projects/new`(등록), `/projects/:id/edit`(수정).

### 2-2. 프로젝트 목록 페이지 (`/projects`)

- **레이아웃**: **다른 백오피스 페이지와 동일한 리스트 형태**. 이미지 그리드·카드 썸네일 없음. **테이블** 컬럼: **순서**(드래그 핸들)·**번호**·**제목**·**기간**·**작업**(보기/수정/삭제). 드래그로 순서 변경 시 `PATCH /api/projects/reorder` (`id_order` 배열). 페이지 배경 **하늘색 풀폭** (`bg-[#F0F9FF]` 등).
- **구성**: 상단에 **프로젝트 섹션 소개 문구** 편집은 **기존대로 유지**(인라인 블록, TextField + 저장). 그 아래 프로젝트 테이블, 등록 버튼 → `/projects/new`. 보기 → ProjectDetailModal, 수정 → `/projects/:id/edit`, 삭제 → 확인 후 `DELETE /api/projects/:id`.

### 2-3. 프로젝트 등록/수정 폼 (`/projects/new`, `/projects/:id/edit`)

- **폼 필드 및 제약**:
  1. **프로젝트명**: 필수, **최대 20자**.
  2. **대표 이미지**: 16:9 권장 (assets 업로드).
  3. **로고 이미지**: 선택. 카드에서 핀 영역에 작은 정사각형으로 표시, 없으면 핀 아이콘 디폴트.
  4. **기간**: 시작일·종료일. **yyyy.mm** 형식 입력/표시. 종료일 Null = 진행중.
  5. **한 줄 설명**: 텍스트 한 줄, **최대 20자**.
  6. **태그**: 다중 선택, **최대 7개**. **엔터로 추가**하는 UI.
  7. **노션 링크**: `notion_url` (카드 클릭 시 이동 URL).
  8. **상단 고정**: `is_pinned` 또는 `sort_order`로 핀 아이콘/정렬 반영.

---

## 3. 백엔드(API & DB) 확장 계획

### 3-1. 스키마 (Projects 테이블)

- **`notion_url`** (VARCHAR(500), Nullable): 카드 메인 랜딩 URL.
- **`is_pinned`** (Boolean, Default 0) [Optional]: 핀 노출 및 정렬.
- **`logo_asset_id`** (BIGINT, Nullable) [Optional]: 핀 영역 작은 정사각형 로고.

### 3-2. API

- `GET /api/projects`: 응답에 `notion_url`, `is_pinned`, `logo`(로고 URL) 포함.
- `POST /api/projects`, `PUT /api/projects/:id`: 위 필드 입력/수정. 프로젝트명·한 줄 설명 20자 제한은 API에서 검증.

---

## 4. 작업 순서 제안

1. **백엔드**: DB 컬럼 추가(`notion_url`, `is_pinned`, `logo_asset_id`) 및 API 입출력 수정.
2. **백오피스**: 라우트·메뉴 추가 → 목록(**리스트 형태**, 소개 문구 편집, 이미지 없음) → 등록/수정 폼(프로젝트명 20자, 한 줄 설명 20자, 기간 yyyy.mm, 태그 최대 7개 엔터 추가, 로고·노션 링크·핀).
3. **클라이언트**: Career·캐러셀 제거, 컨테이너를 Posts와 동일(`max-w-[1200px]`)로 통일, ProjectCard 리뉴얼(16:9, 로고/핀, 제목·기간·태그·한 줄 소개, 클릭 시 노션 새 창), Projects 영역 2열 그리드.

---

## 5. 제약 요약

| 항목 | 제약 |
|------|------|
| 프로젝트명 | 최대 20자 |
| 한 줄 설명 | 최대 20자 |
| 기간 | yyyy.mm 형식 |
| 태그 | 최대 7개, 엔터로 추가 |
| 로고/핀 | 로고 있으면 핀 영역에 작은 정사각형, 없으면 핀 아이콘 디폴트 |

---

## 6. 구현 현황

### 완료

- **백엔드**
  - `projects` 테이블에 `notion_url`, `is_pinned`, `logo_asset_id` 컬럼 추가 (`db_init.py`, 마이그레이션 스크립트 `scripts/add_projects_notion_pinned_logo.py`).
  - `GET /api/projects`: 응답에 `notion_url`, `is_pinned`, `logo`, `logo_asset_id` 포함, `is_pinned DESC` 정렬.
  - `POST /api/projects`, `PUT /api/projects/:id`: 위 필드 및 프로젝트명·한 줄 설명 20자 검증, `_relocate_temp_asset`에 로고 처리.
- **백오피스**
  - AdminLayout: 포트폴리오 관리 하위에 "프로젝트" 메뉴 (경로 `/projects`, 아이콘 `FolderKanban`), getPageTitle·아코디언 경로 반영.
  - App.jsx: `/projects`, `/projects/new`, `/projects/:id/edit` 라우트.
  - ProjectList: 상단 `projectsCareersIntro` 편집, **리스트 형태**(다른 페이지와 동일, 이미지 없음), 행 클릭 시 수정 페이지 이동, 등록 버튼.
  - ProjectForm(등록/수정): 프로젝트명 20자, 대표·로고 이미지 업로드(`folder=projects`), 기간 yyyy.mm, 한 줄 설명 20자, 태그 최대 7개(엔터 추가), 노션 링크, 상단 고정.

### 미완료

- **클라이언트** (섹션 1): 경력·캐러셀 제거, ProjectCard 리뉴얼(16:9, 핀/로고, 노션 링크), Projects 2열 그리드.

---

## 7. 기존 DB 마이그레이션 (주의)

`db_init.py`의 TABLES_SQL은 `CREATE TABLE IF NOT EXISTS`를 사용하므로, **이미 `projects` 테이블이 존재하는** 운영/개발 DB에서는 새 컬럼이 자동으로 추가되지 않습니다. API에서 `unknown column` 에러 시 안내 메시지를 반환하지만, 바로 적용하려면 아래 SQL을 DB 클라이언트에서 한 번 실행하세요.

```sql
-- 기존 projects 테이블에 새 컬럼 추가
ALTER TABLE projects
ADD COLUMN notion_url VARCHAR(500) NULL COMMENT '노션 페이지 URL (카드 클릭 시 이동)',
ADD COLUMN is_pinned TINYINT(1) NOT NULL DEFAULT 0 COMMENT '상단 고정(핀)',
ADD COLUMN logo_asset_id BIGINT NULL COMMENT '로고 이미지 ID (핀 영역 표시)';

-- 외래 키 제약 조건 추가 (선택 사항, 데이터 무결성용)
ALTER TABLE projects
ADD CONSTRAINT fk_projects_logo
FOREIGN KEY (logo_asset_id) REFERENCES assets(id) ON DELETE SET NULL;
```

---

## 8. 참고 구현 (적용 시 유의사항)

아래 세 가지를 적용할 때, 본 프로젝트에 맞게 다음만 맞추면 된다.

### 8-1. ProjectCard.jsx

- **이미지 URL**: `getStaticUrl`은 `../api`에서 import (본 프로젝트는 `utils/assets`가 아님). `import { getStaticUrl } from '../api';`
- **project 필드**: API 응답 기준 — `thumbnail`, `logo`, `title`, `description`, `start_date`, `end_date`, `tags`, `notion_url`, `is_pinned`. 썸네일 경로는 API가 `thumbnail` URL을 주면 `getStaticUrl(project.thumbnail)` 사용.
- **태그**: 프로젝트 소개용 태그는 `project_tag_labels` 기반이라 `tags`가 `[{ name }]` 형태. `tag.id` 없음 → 리스트 key는 `tag.name` 또는 `tag.name + index` 사용.

### 8-2. Projects.jsx (페이지)

- **데이터 로드**: 본 프로젝트는 `fetchProjects()`, `fetchProjectsCareersIntro()`를 `api.js`에서 사용. `fetchProjectsCareersIntro()`는 이미 **문자열** 반환(`res?.text ?? ''`). 따라서 `intro` state에는 그대로 문자열 넣으면 됨. (별도 `apiClient.get('/api/about/projects-careers-intro')` 후 `introRes.data?.text` 사용하지 않아도 됨.)
- **레이아웃**: `SharedLayout`으로 감싸고, 상단에 태그 섹션 있으면 그대로 두고, 프로젝트 섹션만 `max-w-[1200px] mx-auto px-4 md:px-6` + `grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8` 적용.
- **제목**: "프로젝트" 유지, 소개 문구는 `projectsCareersIntro`(위 intro) 한 줄로 표시.

### 8-3. ProjectList.jsx (백오피스)

- **소개 문구 저장**: 본 프로젝트는 `PUT /api/about_messages/projects-careers-intro`에 `{ text: value }` 전송. (제공 코드의 `introRes?.data?.text`, `apiClient.put(..., { text: intro })`와 동일.)
- **소개 문구 로드**: 백엔드가 `GET /api/about/projects-careers-intro`로 문자열 반환. 백오피스에서는 `apiClient.get('/api/about/projects-careers-intro')` 후 응답 구조에 맞춰 `intro` 설정 (예: `data?.text` 또는 `data`가 문자열이면 `data`).
- **태그 표시**: API가 `tags: [{ name }]`만 주므로 `p.tags.slice(0, 3).map(t => ...)`에서 key는 `t.name` 또는 index 조합 사용. `t.id` 없음.
