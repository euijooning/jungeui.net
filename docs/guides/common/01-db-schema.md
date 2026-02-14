# Jungeui LabDB 스키마 (v5.0)

MySQL 8.0 / MariaDB 기준. utf8mb4 사용.

## 테이블 요약

| 테이블 | 설명 |
|--------|------|
| users | 관리자 (이메일 로그인, Bcrypt) |
| assets | 파일 메타데이터 (업로드 자산) |
| categories | 게시글 카테고리 (대/소 계층, parent_id) |
| tags | 공통 태그 (글·프로젝트 공용) |
| posts | 블로그 게시글 |
| post_tags | 글-태그 N:M |
| post_attachments | 글-첨부파일 N:M (다중) |
| careers | 경력/이력 |
| career_links | 경력별 다중 링크 |
| career_highlights | 경력 한 일 개조식 (최대 5) |
| career_tags | 경력-태그 N:M |
| projects | 프로젝트 포트폴리오 (title 최대 25자 권장) |
| about_messages | 소개 인사말 메시지 (과거/현재/미래 스타일) |
| project_links | 프로젝트별 다중 링크 |
| project_tags | 프로젝트-태그 N:M |
| daily_stats | 일별 방문 통계 |

## 경력 확장 테이블 (자동 생성)

`career_links`, `career_highlights`, `career_tags`는 API 서버 기동 시 `db_init._ensure_career_extension_tables()`에서 없으면 자동 생성된다. 별도 스크립트 실행은 필요 없으며, 경력 관련 API 에러 시 'API 서버 재시작' 안내를 따른다.

## posts 날짜 필드 (용어)

- **등록일**: `created_at` — 글 레코드가 최초 생성된 시각. 백오피스 목록·상세 모두 "등록일"로 표기.
- **발행일**: `published_at` — 공개(또는 예약 발행) 시점. NULL이면 미발행.

## 실행 SQL

`scripts/db_reset.py`에서 사용하거나, 아래 SQL을 DB 도구에 붙여넣어 실행.

```sql
DROP DATABASE IF EXISTS jungeui;
CREATE DATABASE jungeui CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE jungeui;

CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL UNIQUE COMMENT '로그인 ID (이메일)',
  password_hash VARCHAR(255) NOT NULL COMMENT '비밀번호 (Hash)',
  name VARCHAR(50) NOT NULL DEFAULT 'Admin' COMMENT '표시 이름',
  last_login_at DATETIME NULL COMMENT '마지막 접속 일시',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT='관리자 계정';

CREATE TABLE assets (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  uuid_name VARCHAR(100) NOT NULL COMMENT '저장된 파일명 (UUID)',
  original_name VARCHAR(255) NOT NULL COMMENT '사용자 업로드 원본명',
  mime_type VARCHAR(50) NOT NULL COMMENT '파일 타입 (image/png 등)',
  file_path VARCHAR(255) NOT NULL COMMENT '서버 저장 경로',
  size_bytes BIGINT NOT NULL COMMENT '파일 크기 (Byte)',
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT='파일 메타데이터';

CREATE TABLE categories (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  parent_id BIGINT NULL COMMENT '상위 카테고리 ID (NULL=대카테고리)',
  name VARCHAR(50) NOT NULL COMMENT '카테고리명',
  sort_order INT DEFAULT 0 COMMENT '노출 순서',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
) COMMENT='게시글 카테고리 (대/소 계층)';

CREATE TABLE tags (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE COMMENT '태그명',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT='공통 태그';

CREATE TABLE posts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT NULL COMMENT '카테고리 ID',
  thumbnail_asset_id BIGINT NULL COMMENT '썸네일 이미지 ID',
  title VARCHAR(200) NOT NULL COMMENT '제목',
  slug VARCHAR(255) NOT NULL UNIQUE COMMENT 'URL 슬러그',
  content_html LONGTEXT NULL COMMENT '뷰어용 HTML',
  content_json LONGTEXT NULL COMMENT '에디터용 JSON',
  status ENUM('DRAFT', 'PUBLISHED', 'PRIVATE', 'UNLISTED') DEFAULT 'DRAFT' COMMENT '상태 (일부공개=UNLISTED)',
  published_at DATETIME NULL COMMENT '발행일',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '등록일',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (thumbnail_asset_id) REFERENCES assets(id) ON DELETE SET NULL
) COMMENT='블로그 게시글';

CREATE TABLE post_tags (
  post_id BIGINT NOT NULL,
  tag_id BIGINT NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) COMMENT='게시글 태그 매핑';

CREATE TABLE post_attachments (
  post_id BIGINT NOT NULL,
  asset_id BIGINT NOT NULL,
  sort_order INT DEFAULT 0 COMMENT '노출 순서',
  PRIMARY KEY (post_id, asset_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
) COMMENT='게시글 첨부파일 (다중)';

CREATE TABLE about_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL COMMENT '소제목 (예: 과거, 현재, 미래)',
  content TEXT NOT NULL COMMENT '내용 (3문장 등)',
  sort_order INT DEFAULT 0 COMMENT '노출 순서',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='소개 인사말 메시지 (과거/현재/미래 스타일)';

CREATE TABLE careers (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  logo_asset_id BIGINT NULL COMMENT '회사 로고 ID',
  company_name VARCHAR(100) NOT NULL COMMENT '회사명',
  role VARCHAR(100) NOT NULL COMMENT '직함/역할',
  start_date DATE NOT NULL COMMENT '시작일',
  end_date DATE NULL COMMENT '종료일 (NULL=재직중)',
  description TEXT NULL COMMENT '성과 상세 내용',
  sort_order INT DEFAULT 0 COMMENT '정렬 순서',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (logo_asset_id) REFERENCES assets(id) ON DELETE SET NULL
) COMMENT='경력 포트폴리오';

CREATE TABLE career_links (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  career_id BIGINT NOT NULL COMMENT '경력 ID',
  link_name VARCHAR(50) NOT NULL COMMENT '버튼명 (웹사이트/깃허브/유튜브/인스타그램/기타)',
  link_url VARCHAR(500) NOT NULL COMMENT '이동 URL',
  sort_order INT DEFAULT 0 COMMENT '버튼 순서',
  FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE CASCADE
) COMMENT='경력 관련 링크들';

CREATE TABLE career_highlights (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  career_id BIGINT NOT NULL COMMENT '경력 ID',
  content VARCHAR(500) NOT NULL COMMENT '한 일 항목 (개조식)',
  sort_order INT DEFAULT 0 COMMENT '노출 순서',
  FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE CASCADE
) COMMENT='경력 한 일 (최대 5개)';

CREATE TABLE career_tags (
  career_id BIGINT NOT NULL,
  tag_id BIGINT NOT NULL,
  PRIMARY KEY (career_id, tag_id),
  FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) COMMENT='경력-태그 N:M (최대 5개)';

CREATE TABLE projects (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  thumbnail_asset_id BIGINT NULL COMMENT '대표 이미지 ID',
  intro_image_asset_id BIGINT NULL COMMENT '소개 이미지 ID (상세 아래 직사각형)',
  title VARCHAR(100) NOT NULL COMMENT '프로젝트명',
  description TEXT NULL COMMENT '상세 내용',
  start_date DATE NULL COMMENT '시작일',
  end_date DATE NULL COMMENT '종료일',
  sort_order INT DEFAULT 0 COMMENT '정렬 순서',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thumbnail_asset_id) REFERENCES assets(id) ON DELETE SET NULL,
  FOREIGN KEY (intro_image_asset_id) REFERENCES assets(id) ON DELETE SET NULL
) COMMENT='프로젝트 포트폴리오';

CREATE TABLE project_links (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT NOT NULL COMMENT '프로젝트 ID',
  link_name VARCHAR(50) NOT NULL COMMENT '버튼명 (예: GitHub)',
  link_url VARCHAR(500) NOT NULL COMMENT '이동 URL',
  sort_order INT DEFAULT 0 COMMENT '버튼 순서',
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) COMMENT='프로젝트 관련 링크들';

CREATE TABLE project_tags (
  project_id BIGINT NOT NULL,
  tag_id BIGINT NOT NULL,
  PRIMARY KEY (project_id, tag_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) COMMENT='프로젝트 기술스택 매핑';

CREATE TABLE daily_stats (
  date DATE PRIMARY KEY COMMENT '날짜 (YYYY-MM-DD)',
  total_views INT DEFAULT 0 COMMENT '총 조회수',
  visitor_count INT DEFAULT 0 COMMENT '방문자수'
) COMMENT='일별 방문 통계';
```

관리자 계정은 서버 기동 시 `apps/api/core/db_init.py`의 `_ensure_admin()`에서 env(SEED_ADMIN_EMAIL 등)로 없을 때만 생성. 기타 초기 데이터는 `02-api-spec.md` 시드 섹션 참고.
