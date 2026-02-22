"""
스테이징 DB 전체 리셋 (DROP 후 재생성).
사용: python scripts/db_reset_staging.py
주의: 기존 스테이징 DB를 삭제하고 새로 만듭니다. 데이터 손실에 유의하세요.
환경변수: .env.staging 우선, 없으면 .env
  MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE (기본 jungeui_staging), MYSQL_PORT
"""
import os
import re
import sys

# 프로젝트 루트를 path에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import pymysql
    from dotenv import load_dotenv
except ImportError:
    print("pip install pymysql python-dotenv 후 실행하세요.")
    sys.exit(1)

# .env.staging 있으면 먼저 로드, 그 다음 .env (스테이징 전용 설정 우선)
load_dotenv(".env.staging")
load_dotenv()

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_USER = os.getenv("MYSQL_USER", "ejlab")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "jungeui_staging")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))

# DB명 안전 검사 (영문, 숫자, 언더스코어만)
if not re.match(r"^[a-zA-Z0-9_]+$", MYSQL_DATABASE):
    print("MYSQL_DATABASE는 영문, 숫자, 언더스코어만 허용됩니다.")
    sys.exit(1)

# 테이블 생성 SQL (db_reset.py, docs/01-db-schema.md 와 동기화)
TABLES_SQL = """
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

CREATE TABLE about_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL COMMENT '소제목 (예: 과거, 현재, 미래)',
  content TEXT NOT NULL COMMENT '내용 (3문장 등)',
  sort_order INT DEFAULT 0 COMMENT '노출 순서',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='소개 인사말 메시지 (과거/현재/미래 스타일)';
"""


def main():
    conn = pymysql.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD or None,
        port=MYSQL_PORT,
        charset="utf8mb4",
    )
    try:
        with conn.cursor() as cur:
            cur.execute(f"DROP DATABASE IF EXISTS `{MYSQL_DATABASE}`")
            cur.execute(f"CREATE DATABASE `{MYSQL_DATABASE}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            cur.execute(f"USE `{MYSQL_DATABASE}`")
        for stmt in TABLES_SQL.strip().split(";"):
            stmt = stmt.strip()
            if not stmt or stmt.startswith("--"):
                continue
            with conn.cursor() as cur:
                cur.execute(stmt)
        conn.commit()
        print(f"[스테이징] DB 리셋 완료: {MYSQL_DATABASE} (서버 재시작 시 시드 자동 적용)")
    except Exception as e:
        print("오류:", e)
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
