# 백오피스 구현 가이드 (Jungeui Labs)

참조: [docs/01-db-schema.md](../docs/01-db-schema.md), [docs/02-api-spec.md](../docs/02-api-spec.md), [docs/03-folder-structure.md](../docs/03-folder-structure.md)

## 목표

Jungeui Labs 관리자용 백오피스. 대시보드, 글(목록·에디터), 경력, 프로젝트, 파일 보관함. 인증은 Session Cookie·JWT (02-api-spec 기준).

## DB ↔ API 대응

| 테이블 (01-db-schema) | API (02-api-spec) |
|-----------------------|-------------------|
| users | POST /api/auth/login |
| posts, post_tags | GET/POST/PUT/DELETE /api/posts, GET /api/categories, GET /api/tags |
| careers | GET/POST/PUT /api/careers, PATCH /api/careers/reorder |
| projects, project_links, project_tags | GET/POST/PUT /api/projects, PATCH /api/projects/reorder |
| assets | POST /api/assets/upload, GET/DELETE /api/assets |
| daily_stats | GET /api/dashboard/stats |

## 레거시 제거 (은혜이음교회 백오피스 샘플코드 기준)

- **AdminLayout**: `navSections`(회원 관리, 콘텐츠 관리, 교회소개, 교적, 설정, 가족모임 관리) 제거. 아코디언·경로 매핑·`getPageTitle` 등 레거시 경로 전부 제거. Jungeui 6개 메뉴만 유지 (AppMenu와 동일: 대시보드, 글 관리, 글 쓰기, 경력, 프로젝트, 파일 보관함).
- **기타**: `/users`, `/content/*`, `/church/*`, `/membership/*`, `/settings`, `/faq`, `/leaders` 등 라우트·메뉴 참조 제거.

## 구현 순서

| Phase | 문서 | 내용 |
|-------|------|------|
| 1 ✅ | [phase-01-backoffice-cleanup-and-api.md](phase-01-backoffice-cleanup-and-api.md) | 레거시 제거, API·인증 연동, 대시보드 (완료) |
| 2 ✅ | [phase-02-posts-and-editor.md](phase-02-posts-and-editor.md) | 글 목록·글 쓰기(Toast UI 에디터·설정 패널) (완료) |
| 3 | [phase-03-careers-and-projects.md](phase-03-careers-and-projects.md) | 경력·프로젝트 CRUD·드래그 정렬 |
| 4 | [phase-04-assets.md](phase-04-assets.md) | 파일 보관함 갤러리·업로드·삭제 |
| 5 | [phase-05-client-guide.md](phase-05-client-guide.md) | 클라이언트 구현 순서 (백오피스 이후) |

디자인·공통 UI는 [docs/04-design-guide.md](../docs/04-design-guide.md) 및 `shared/ui-kit` 참고.
