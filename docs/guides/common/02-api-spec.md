# Jungeui LabAPI 명세

API 베이스: `http://localhost:8010` (또는 환경변수 `VITE_API_URL` / 백오피스)

## 인증

- 관리자: 이메일 + 비밀번호 로그인 → JWT 또는 세션 쿠키.
- 공개 읽기: 인증 없이 GET (글 목록, 글 상세, 카테고리, 태그, 경력, 프로젝트).

## 엔드포인트 요약

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | /auth/login | 관리자 로그인 | - |
| POST | /auth/logout | 로그아웃 | Admin |
| GET | /posts | 글 목록 (필터: category, tag, status) | 공개 시 status=PUBLISHED |
| GET | /posts/{id} | 글 상세 (id 또는 slug) | 공개 시 PUBLISHED만 |
| POST | /posts | 글 생성 | Admin |
| PUT | /posts/{id} | 글 수정 | Admin |
| DELETE | /posts/{id} | 글 삭제 | Admin |
| GET | /categories | 카테고리 목록 | 공개 |
| GET | /tags | 태그 목록 (인기 상위 등) | 공개 |
| GET | /about/messages | 소개 인사말 메시지 목록 | 공개 |
| GET | /about_messages | 메시지 목록 | Admin |
| POST | /about_messages | 메시지 생성 | Admin |
| PUT | /about_messages/{id} | 메시지 수정 | Admin |
| DELETE | /about_messages/{id} | 메시지 삭제 | Admin |
| GET | /careers | 경력 목록 (sort_order). 응답에 logo(URL), career_links, career_highlights, career_tags 포함 | 공개 |
| POST | /careers | 경력 생성 | Admin |
| PUT | /careers/{id} | 경력 수정 | Admin |
| DELETE | /careers/{id} | 경력 삭제 | Admin |
| PATCH | /careers/reorder | 경력 정렬 변경 | Admin |
| GET | /projects | 프로젝트 목록 | 공개 |
| POST | /projects | 프로젝트 생성 | Admin |
| PUT | /projects/{id} | 프로젝트 수정 | Admin |
| PATCH | /projects/reorder | 프로젝트 정렬 변경 | Admin |
| POST | /assets/upload | 파일 업로드 | Admin |
| GET | /assets | 자산 목록 (갤러리) | Admin |
| DELETE | /assets/{id} | 자산 삭제 (사용 여부 체크) | Admin |
| GET | /dashboard/stats | 대시보드 통계 (방문자/조회수) | Admin |
| GET | /dashboard/recent-activity | 최근 수정 글 5건 | Admin |
| GET | /sitemap.xml | 사이트맵 (동적 생성) | 공개 |

상세 요청/응답 스키마는 구현 시 `apps/api/routers/` 내 각 라우터에 맞춰 확정. GET /careers 응답 항목: id, logo_asset_id, logo(URL), company_name, role, start_date, end_date, description, sort_order, links, highlights, tags.

## 시드 데이터

- 관리자: 서버 기동 시 `db_init._ensure_admin`에서 env(SEED_ADMIN_EMAIL 등)로 **없을 때만** 생성. `ej@jungeui.net` / 비밀번호는 .env에서 설정.
- 카테고리·about_messages: 수동 또는 백오피스에서 추가.
