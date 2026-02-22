# 백오피스 구현 가이드 (Jungeui Labs)

참조: [../common/01-db-schema.md](../common/01-db-schema.md), [../common/02-api-spec.md](../common/02-api-spec.md), [../common/03-folder-structure.md](../common/03-folder-structure.md)

## 목표

Jungeui Labs 관리자용 백오피스. 대시보드, 글(목록·에디터), 경력, 프로젝트. 인증은 Session Cookie·JWT (02-api-spec 기준).

## DB ↔ API 대응

| 테이블 (01-db-schema) | API (02-api-spec) |
|-----------------------|-------------------|
| users | POST /api/auth/login |
| posts, post_tags | GET/POST/PUT/DELETE /api/posts, GET /api/categories, GET /api/tags |
| careers | GET/POST/PUT /api/careers, PATCH /api/careers/reorder |
| projects, project_links, project_tags | GET/POST/PUT /api/projects, PATCH /api/projects/reorder |
| assets | POST /api/assets/upload, GET/DELETE /api/assets |
| daily_stats | GET /api/dashboard/stats, GET /api/dashboard/recent-activity. 갱신은 퍼블릭 post 조회 시 posts 라우터에서 자동 기록 |

## 레거시 제거 (백오피스 샘플코드 기준)

- **AdminLayout**: `navSections`(회원 관리, 콘텐츠 관리, 교회소개, 교적, 설정, 가족모임 관리) 제거. 아코디언·경로 매핑·`getPageTitle` 등 레거시 경로 전부 제거. Jungeui 5개 메뉴만 유지 (대시보드, 글 관리, 글 쓰기, 경력, 프로젝트).
- **기타**: `/users`, `/content/*`, `/church/*`, `/membership/*`, `/settings`, `/faq`, `/leaders` 등 라우트·메뉴 참조 제거.

## 구현 순서

| Phase | 문서 | 내용 |
|-------|------|------|
| 1 ✅ | [02-phase-01-cleanup-and-api.md](02-phase-01-cleanup-and-api.md) | 레거시 제거, API·인증 연동, 대시보드 (완료) |
| 2 ✅ | [03-phase-02-posts-and-editor.md](03-phase-02-posts-and-editor.md) | 글 목록·글 쓰기(Toast UI 에디터·설정 패널) (완료) |
| 3 ✅ | [04-phase-03-careers-and-projects.md](04-phase-03-careers-and-projects.md) | 경력·프로젝트 CRUD·드래그 정렬 (완료) |
| 5 | [05-phase-05-category-management.md](05-phase-05-category-management.md) | 카테고리 관리 (대/소 계층, 포스트 하위 메뉴, 클라이언트 게시판 표시) |

디자인·공통 UI는 [../common/04-design-guide.md](../common/04-design-guide.md) 및 `shared/ui-kit` 참고.

## 구현 완료 Phase 요약

| Phase | 상태 | 내용 |
|-------|------|------|
| Phase 01 | 완료 | 레거시 제거, API·인증 연동, 대시보드 |
| Phase 02 | 완료 | 글 목록·글 쓰기(Toast UI 에디터·설정 패널)·상세·첨부파일 |
| Phase 03 | 완료 | 경력·프로젝트 CRUD·드래그 정렬 |

## 기술 스택·주요 파일

- **스택**: React, React Admin, MUI, Tailwind CSS, Toast UI Editor. API: FastAPI(JWT). 테마·다크·폰트·사이드바는 [../common/10-backoffice-ui-guide.md](../common/10-backoffice-ui-guide.md) 참고.
- **API URL 단일 소스**: `lib/apiConfig.js`(API_BASE, isDev, UPLOAD_URL) → `lib/apiClient.js`가 사용·재export. 페이지·dataProvider는 apiClient에서 import. [../common/09-security-and-shared-config.md](../common/09-security-and-shared-config.md) 참고.
- **공통 유틸**: 날짜 포맷은 `shared/utils/date.js`의 `formatDate(iso, options)` 사용 (client·backoffice 공용).
- **페이지**: `apps/backoffice/src/pages/` — `dashboard/Dashboard.jsx`, `posts/PostList.jsx`, `PostDetail.jsx`, `PostNew.jsx`, `PostEdit.jsx`, `PostEditor.jsx`, `categories/CategoryList.jsx`, `messages/MessageList.jsx`, `careers/CareerList.jsx`, `projects/ProjectList.jsx`, `notifications/NotificationsPage.jsx`.
- **라우트** (App.jsx CustomRoutes): `/`(대시보드), `/posts`, `/posts/new`, `/posts/:postId/edit`, `/posts/:postId`, `/posts/categories`, `/messages`, `/careers`, `/projects`, `/notifications`.

## 참고 문서

- [06-phase-checklist.md](06-phase-checklist.md) — Phase별 체크리스트
- [../common/10-backoffice-ui-guide.md](../common/10-backoffice-ui-guide.md) — 백오피스 UI 총체 (테마·다크·폰트·사이드바·로그인)
- [../common/01-db-schema.md](../common/01-db-schema.md), [../common/02-api-spec.md](../common/02-api-spec.md), [../common/04-design-guide.md](../common/04-design-guide.md)
