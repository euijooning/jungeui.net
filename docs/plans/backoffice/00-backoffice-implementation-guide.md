# 백오피스 구현 가이드 (Jungeui Labs)

참조: [guides/common/01-db-schema.md](../../guides/common/01-db-schema.md), [guides/common/02-api-spec.md](../../guides/common/02-api-spec.md), [guides/common/03-folder-structure.md](../../guides/common/03-folder-structure.md)

## 목표

Jungeui Labs 관리자용 백오피스. 대시보드, 글(목록·에디터), 경력, 프로젝트, 메시지, 카테고리. 인증은 Session Cookie·JWT (02-api-spec 기준).

## DB ↔ API 대응

| 테이블 (01-db-schema) | API (02-api-spec) |
|-----------------------|-------------------|
| users | POST /api/auth/login |
| posts, post_tags | GET/POST/PUT/DELETE /api/posts, GET /api/categories, GET /api/tags |
| careers | GET/POST/PUT /api/careers, PATCH /api/careers/reorder |
| projects, project_links, project_tags | GET/POST/PUT /api/projects, PATCH /api/projects/reorder |
| about_messages | GET /api/about/messages (공개), GET/POST/PUT/DELETE /api/about_messages (Admin) |
| assets | POST /api/assets/upload, GET/DELETE /api/assets |
| daily_stats | GET /api/dashboard/stats, GET /api/dashboard/recent-activity. 갱신: 퍼블릭 post 조회 시 자동 |

## 문서 구조 (세분화)

| 영역 | 문서 | 내용 |
|------|------|------|
| **레이아웃·대시보드** | [layout/](layout/) | AdminLayout(단일 레이아웃), 레거시 제거, API 연동, 대시보드, 반응형, 알림·다크모드, Phase 체크리스트 |
| **포스트** | [posts/](posts/) | 글 목록·글 쓰기(Toast UI 에디터·설정 패널) |
| **카테고리** | [category/](category/) | 대/소 계층, 포스트 하위 메뉴, 클라이언트 게시판 표시 |
| **메시지** | [message/](message/) | 소개 인사말(about_messages) CRUD |
| **프로젝트** | [project/](project/) | 프로젝트 CRUD·드래그 정렬 |
| **경력** | [career/](career/) | 경력 CRUD·드래그 정렬 |

## 구현 순서 (참고)

| 순서 | 문서 | 상태 |
|------|------|------|
| 1 | [layout/01-cleanup-and-api.md](layout/01-cleanup-and-api.md) | 완료 |
| 2 | [layout/02-implemented-features.md](layout/02-implemented-features.md) | 완료 |
| 3 | [posts/01-posts-and-editor.md](posts/01-posts-and-editor.md) | 완료 |
| 4 | [message/01-messages-overview.md](message/01-messages-overview.md) | 완료 |
| 5 | [career/01-careers-crud.md](career/01-careers-crud.md) | 완료 |
| 6 | [project/01-projects-crud.md](project/01-projects-crud.md) | 완료 |
| 7 | [category/01-category-management.md](category/01-category-management.md) | 예정 |
| 8 | [layout/03-phase-checklist.md](layout/03-phase-checklist.md) | Phase별 체크리스트 |

디자인·공통 UI는 [04-design-guide.md](../../guides/common/04-design-guide.md) 및 `shared/ui-kit` 참고.
