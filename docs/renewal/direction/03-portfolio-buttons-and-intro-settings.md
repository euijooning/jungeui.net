# 포트폴리오 버튼 및 소개 설정 구현 가이드

클라이언트 Portfolio 페이지에 이력서/포트폴리오 2단 버튼 추가, 백오피스 "소개 관리" 메뉴·설정 페이지 추가. 저장 시 클라이언트에 반영.

---

## 1. 요구사항 요약

| 구분 | 내용 |
|------|------|
| **클라이언트** | mail 버튼 아래 2단 그리드로 이력서·포트폴리오 버튼. 연한 하늘색(#F0F9FF) 전체 배경, min-h-screen. 링크 없으면 버튼 미렌더. 로딩 시 스켈레톤. |
| **백오피스** | 포트폴리오 관리 하위 "소개 관리" (/intro). 이력서/포트폴리오 링크·소개 문구(각 20자) 한 화면에서 설정. |

---

## 2. 백엔드 (DB & API)

### 2-1. DB: site_settings

- **저장소**: 기존 `site_settings` 키-값 테이블.
- **URL 길이**: `value` 컬럼을 **TEXT**로 변경하는 마이그레이션 적용 (Notion 등 긴 URL 대응).  
  - 마이그레이션: `ALTER TABLE site_settings MODIFY COLUMN value TEXT NULL;`

### 2-2. 키(Key) 정의

| 키 | 설명 |
|----|------|
| `portfolio_resume_link` | 이력서 URL |
| `portfolio_portfolio_link` | 포트폴리오 URL |
| `portfolio_resume_intro` | 이력서 버튼 설명 (20자 제한) |
| `portfolio_portfolio_intro` | 포트폴리오 버튼 설명 (20자 제한) |

### 2-3. API 설계

**(1) 공개 API: 링크 조회**

- **Endpoint**: `GET /api/about/portfolio-links`
- **Access**: Public (인증 불필요)
- **Response**: `{ resume_link, portfolio_link, resume_intro, portfolio_intro }` (각 문자열)
- **로직**: DB에 키가 존재하지 않아도 에러 없이, 각 필드를 `""`(빈 문자열) 또는 `null`로 채워서 반환.

**(2) 관리 API: 링크 수정**

- **Endpoint**: `PUT /api/about_messages/portfolio-links`
- **Access**: Admin Only (인증 필요)
- **Body**: `{ resume_link?, portfolio_link?, resume_intro?, portfolio_intro? }`
- **로직**:
  - 소개 문구(`_intro`)는 20자 제한 검사 (초과 시 400 Bad Request).
  - `site_settings` 테이블에 키별로 Upsert (있으면 Update, 없으면 Insert).

---

## 3. 클라이언트 (Client)

### 3-1. API 연동

- **파일**: `apps/client/src/api.js`
- **추가**: `fetchPortfolioLinks()` → `GET /api/about/portfolio-links` 호출 후 `{ resume_link, portfolio_link, resume_intro, portfolio_intro }` 반환.

### 3-2. UI 구현 (Portfolio.jsx)

- **위치**: 상단 `#F0F9FF`(하늘색) 배경 섹션 내, mailto 버튼 하단.
- **배경**: 해당 섹션에 `min-h-screen` 적용해 하단 흰 여백 방지.
- **레이아웃**: 반응형 2단 그리드 (모바일 세로, 데스크톱 가로). 가운데 정렬.
- **카드 디자인**:
  - **이력서 버튼**: 검정 배경 (`bg-gray-900`), 흰색 텍스트. 제목 "이력서", 설명은 `resume_intro` 또는 "이력서 보러가기".
  - **포트폴리오 버튼**: 진한 파랑 배경 (`bg-blue-800`), 흰색 텍스트. 제목 "포트폴리오", 설명은 `portfolio_intro` 또는 "포트폴리오 보러가기".
  - 공통: 둥근 모서리, 제목(Bold) + 설명(Small), `target="_blank" rel="noopener noreferrer"`.
- **로딩 상태**: 데이터 페칭 중에는 버튼 위치에 회색 스켈레톤 박스 표시 (레이아웃 흔들림 방지).
- **조건부 렌더링**: `resume_link` / `portfolio_link` 값이 비어 있으면(`""` or `null`) 해당 버튼은 **렌더링하지 않음(숨김)**. 비활성 버튼 노출 금지.

---

## 4. 백오피스 (Backoffice)

### 4-1. 메뉴 및 라우팅

- **메뉴**: AdminLayout > "포트폴리오 관리" 하위에 "소개 관리" (`/intro`) 추가 (프로젝트 아래).
- **라우트**: App.jsx에 `/intro` → `IntroSettingsPage` 연결.
- **헤더 타이틀**: `titles["/intro"] = "소개 관리"`, 아코디언 활성 조건에 `/intro` 포함.

### 4-2. 설정 페이지 (IntroSettingsPage)

- **구성**: 4개 입력 필드를 한 화면에 배치.
  1. 이력서 링크 (URL)
  2. 포트폴리오 링크 (URL)
  3. 이력서 소개 한 문장 (20자 제한)
  4. 포트폴리오 소개 문구 한 문장 (20자 제한)
- **UX**:
  - **글자 수 카운터**: 소개 문구 입력란 옆에 `(12/20)` 형태의 실시간 카운터. 20자 초과 입력 방지.
  - **URL 자동 보정**: 저장 시 또는 포커스 아웃 시, `http://` / `https://`로 시작하지 않으면 앞에 `https://` 자동 추가. (옵션) 유효하지 않은 URL 형식 시 경고 메시지.
- **데이터 흐름**: 마운트 시 GET API로 폼 채움 → [저장] 클릭 시 PUT API 호출 → 성공 시 "저장되었습니다" 알림.

---

## 5. 작업 순서

1. **[Backend]** site_settings 테이블 `value` 컬럼 TEXT 타입으로 변경 (마이그레이션).
2. **[Backend]** API 구현 (about.py, about_messages.py).
3. **[Backoffice]** 소개 관리 페이지 및 메뉴·라우트 구현 (데이터 입력 테스트).
4. **[Client]** API 함수 추가 및 Portfolio 상단 섹션 UI 구현 (스켈레톤, 조건부 렌더링 적용).
