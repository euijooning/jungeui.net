# Jungeui LabDB 스키마 (v5.0)

MySQL 8.0 / MariaDB 기준. utf8mb4 사용.

## 테이블 요약

| 테이블 | 설명 |
|--------|------|
| users | 관리자 (이메일 로그인, Bcrypt) |
| assets | 파일 메타데이터 (업로드 자산) |
| categories | 게시글 카테고리 (1 depth) |
| tags | 공통 태그 (글·프로젝트 공용) |
| posts | 블로그 게시글 |
| post_tags | 글-태그 N:M |
| post_attachments | 글-첨부파일 N:M (다중) |
| careers | 경력/이력 |
| projects | 프로젝트 포트폴리오 |
| project_links | 프로젝트별 다중 링크 |
| project_tags | 프로젝트-태그 N:M |
| daily_stats | 일별 방문 통계 |

## 실행 SQL

`scripts/db_init.py`에서 사용하거나, 아래 SQL을 DB 도구에 붙여넣어 실행.

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
  name VARCHAR(50) NOT NULL COMMENT '카테고리명',
  slug VARCHAR(50) NOT NULL UNIQUE COMMENT 'URL 별칭',
  sort_order INT DEFAULT 0 COMMENT '노출 순서',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT='게시글 카테고리';

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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

CREATE TABLE projects (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  thumbnail_asset_id BIGINT NULL COMMENT '대표 이미지 ID',
  title VARCHAR(100) NOT NULL COMMENT '프로젝트명',
  subtitle VARCHAR(200) NULL COMMENT '한줄 소개',
  description TEXT NULL COMMENT '상세 내용',
  start_date DATE NULL COMMENT '시작일',
  end_date DATE NULL COMMENT '종료일',
  sort_order INT DEFAULT 0 COMMENT '정렬 순서',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thumbnail_asset_id) REFERENCES assets(id) ON DELETE SET NULL
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

초기 데이터(시드)는 `scripts/seed_data.py` 또는 `02-api-spec.md` 시드 섹션 참고.
