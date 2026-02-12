# 소개 페이지 레이아웃 구현 계획

구현 후 해당 항목을 체크. **Phase 완료 시 "완료 점검" 항목을 실행하고 보고.**

참조: [04-about.md](04-about.md), [00-client-implementation-guide.md](00-client-implementation-guide.md), [02-api-spec.md](../../guides/common/02-api-spec.md), [sungbin.dev/about](https://sungbin.dev/about/)

---

## 1. 백오피스 메뉴 재구조화

**대상**: `apps/backoffice/src/components/AdminLayout.jsx`

**변경 후 navSections 구조:**
- 대시보드 (단일)
- **포스트 관리** (아코디언: 포스트 목록, 카테고리 관리)
- **소개 관리** (아코디언, 신규)
  - 메시지 → `/messages`
  - 경력 → `/careers`
  - 프로젝트 → `/projects`

**체크리스트:**
- [x] `aboutAccordionOpen` state 추가
- [x] `/messages`, `/careers`, `/projects` 경로에서 소개 아코디언 자동 열기
- [x] `isActive`에서 `/messages`, `/careers`, `/projects` 소개 하위 반영
- [x] `getPageTitle`에 `/messages` → "메시지" 추가
- [x] careers/projects를 단일에서 제거, 소개 아코디언 하위로 이동
- [x] `singleLinkHref`, `aboutAsSingleLink` 처리 (사이드바 축소 시 단일 링크)

---

## 2. 메시지(about_messages) 백엔드

### 2-1. DB 스키마

- [x] `docs/guides/common/01-db-schema.md`에 about_messages 테이블 문서화
- [x] `scripts/db_reset.py`에 테이블 생성 로직 추가
- [x] `scripts/migrate_about_messages.py` 생성 (기존 DB용)
- [ ] `scripts/seed_data.py`에 과거/현재/미래 3개 시드 추가 (해당 없음. 시드 제거됨. about_messages는 백오피스에서 직접 추가)

```sql
CREATE TABLE about_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL COMMENT '소제목 (예: 과거, 현재, 미래)',
  content TEXT NOT NULL COMMENT '내용 (3문장 등)',
  sort_order INT DEFAULT 0 COMMENT '노출 순서',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='소개 인사말 메시지 (과거/현재/미래 스타일)';
```

### 2-2. API

- [x] `apps/api/routers/about.py`: GET /api/about/messages (공개)
- [x] `apps/api/routers/about_messages.py`: GET/POST/PUT/DELETE /api/about_messages (Admin)
- [x] `apps/api/routers/__init__.py`에 라우터 등록
- [x] `docs/guides/common/02-api-spec.md`에 엔드포인트 추가

---

## 3. 백오피스 메시지 관리 페이지

- [x] `apps/backoffice/src/pages/messages/MessageList.jsx` 생성
  - 목록: 제목, 내용 요약, sort_order, 수정/삭제
  - 모달 또는 인라인 편집으로 제목/내용/순서 수정
- [x] `apps/backoffice/src/App.jsx`에 `/messages` 라우트 추가
- [x] apiClient로 CRUD 연동

---

## 4. 클라이언트 인사말 영역

**대상**: `apps/client/src/pages/About.jsx`

| 항목 | 처리 | 설명 |
|------|------|------|
| 1 | 하드코딩 | "끝내는 기획자, 정의준입니다." → 정의준에 파란색(또는 --ui-primary) 및 밑줄 |
| 2 | 하드코딩 | 녹색 점만 (선 없음), 최대 3개, 가운데 정렬 |
| 3, 4 | API | GET /api/about/messages로 제목·내용 fetch → 하늘색 소제목 + 본문, 최대 3개 |
| 5 | 하드코딩 | 메시지 아이콘 + ej@jungui.net, mailto:ej@jungui.net |

- [x] `apps/client/src/api.js`에 fetchAboutMessages() 추가
- [x] 인사말 섹션 마크업 (제목, 점, 메시지 그리드, 이메일 버튼)

---

## 완료 점검

- [x] 백오피스: 소개 메뉴에서 메시지/경력/프로젝트 접근 가능
- [x] 백오피스: 메시지 CRUD 동작
- [x] 클라이언트: /about에서 인사말(제목, 점, 메시지 3개, 이메일) 표시
- [x] API: GET /api/about/messages 공개 조회 동작

**Phase 완료** (점검일: 2025-02-10)
