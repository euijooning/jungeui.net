"""
서버 시작 시 DB 테이블 자동 생성 및 관리자 계정 초기화.
- DB 없으면 생성, 테이블 없으면 생성 (CREATE TABLE IF NOT EXISTS)
- env 관리자 계정이 없을 때만 생성 (있으면 건드리지 않음)
"""
import logging
import os

import bcrypt
import pymysql

from apps.api.core.config import (
    MYSQL_DATABASE,
    MYSQL_HOST,
    MYSQL_PASSWORD,
    MYSQL_PORT,
    MYSQL_USER,
)

logger = logging.getLogger(__name__)

# 시드용 환경변수
SEED_ADMIN_EMAIL = os.getenv("SEED_ADMIN_EMAIL", "me@jungeui.net")
SEED_ADMIN_PASSWORD = os.getenv("SEED_ADMIN_PASSWORD", "changeme")
SEED_ADMIN_NAME = os.getenv("SEED_ADMIN_NAME", "JungeuiLab")

# CREATE TABLE IF NOT EXISTS (docs/guides/common/01-db-schema.md 동기화)
TABLES_SQL = """
CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL UNIQUE COMMENT '로그인 ID (이메일)',
  password_hash VARCHAR(255) NOT NULL COMMENT '비밀번호 (Hash)',
  name VARCHAR(50) NOT NULL DEFAULT 'Admin' COMMENT '표시 이름',
  last_login_at DATETIME NULL COMMENT '마지막 접속 일시',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT='관리자 계정';

CREATE TABLE IF NOT EXISTS assets (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  uuid_name VARCHAR(100) NOT NULL COMMENT '저장된 파일명 (UUID)',
  original_name VARCHAR(255) NOT NULL COMMENT '사용자 업로드 원본명',
  mime_type VARCHAR(50) NOT NULL COMMENT '파일 타입 (image/png 등)',
  file_path VARCHAR(255) NOT NULL COMMENT '서버 저장 경로',
  size_bytes BIGINT NOT NULL COMMENT '파일 크기 (Byte)',
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT='파일 메타데이터';

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  parent_id BIGINT NULL COMMENT '상위 카테고리 ID (NULL=대카테고리)',
  name VARCHAR(50) NOT NULL COMMENT '카테고리명',
  sort_order INT DEFAULT 0 COMMENT '노출 순서',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
) COMMENT='게시글 카테고리 (대/소 계층)';

CREATE TABLE IF NOT EXISTS tags (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE COMMENT '태그명',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT='공통 태그';

CREATE TABLE IF NOT EXISTS post_prefixes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(20) NOT NULL COMMENT '말머리 이름 (최대 20자)',
  sort_order INT DEFAULT 0 COMMENT '노출 순서',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT='게시글 말머리';

CREATE TABLE IF NOT EXISTS posts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT NULL COMMENT '카테고리 ID',
  prefix_id BIGINT NULL COMMENT '말머리 ID',
  thumbnail_asset_id BIGINT NULL COMMENT '썸네일 이미지 ID',
  title VARCHAR(200) NOT NULL COMMENT '제목',
  slug VARCHAR(255) NOT NULL UNIQUE COMMENT 'URL 슬러그',
  content_html LONGTEXT NULL COMMENT '뷰어용 HTML',
  content_json LONGTEXT NULL COMMENT '에디터용 JSON',
  status ENUM('DRAFT', 'PUBLISHED', 'PRIVATE', 'UNLISTED') DEFAULT 'DRAFT' COMMENT '상태 (일부공개=UNLISTED)',
  published_at DATETIME NULL COMMENT '발행일',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  view_count INT DEFAULT 0 COMMENT '조회수',
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (prefix_id) REFERENCES post_prefixes(id) ON DELETE SET NULL,
  FOREIGN KEY (thumbnail_asset_id) REFERENCES assets(id) ON DELETE SET NULL
) COMMENT='블로그 게시글';

CREATE TABLE IF NOT EXISTS post_tags (
  post_id BIGINT NOT NULL,
  tag_id BIGINT NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) COMMENT='게시글 태그 매핑';

CREATE TABLE IF NOT EXISTS post_attachments (
  post_id BIGINT NOT NULL,
  asset_id BIGINT NOT NULL,
  sort_order INT DEFAULT 0 COMMENT '노출 순서',
  PRIMARY KEY (post_id, asset_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
) COMMENT='게시글 첨부파일 (다중)';

CREATE TABLE IF NOT EXISTS careers (
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

CREATE TABLE IF NOT EXISTS projects (
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

CREATE TABLE IF NOT EXISTS project_links (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT NOT NULL COMMENT '프로젝트 ID',
  link_name VARCHAR(50) NOT NULL COMMENT '버튼명 (예: GitHub)',
  link_url VARCHAR(500) NOT NULL COMMENT '이동 URL',
  sort_order INT DEFAULT 0 COMMENT '버튼 순서',
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) COMMENT='프로젝트 관련 링크들';

CREATE TABLE IF NOT EXISTS project_tags (
  project_id BIGINT NOT NULL,
  tag_id BIGINT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0 COMMENT '태그 노출 순서',
  PRIMARY KEY (project_id, tag_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) COMMENT='프로젝트 기술스택 매핑';

CREATE TABLE IF NOT EXISTS daily_stats (
  date DATE PRIMARY KEY COMMENT '날짜 (YYYY-MM-DD)',
  total_views INT DEFAULT 0 COMMENT '총 조회수',
  visitor_count INT DEFAULT 0 COMMENT '방문자수'
) COMMENT='일별 방문 통계';

CREATE TABLE IF NOT EXISTS about_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL COMMENT '소제목 (예: 과거, 현재, 미래)',
  content TEXT NOT NULL COMMENT '내용 (3문장 등)',
  sort_order INT DEFAULT 0 COMMENT '노출 순서',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='소개 인사말 메시지 (과거/현재/미래 스타일)';
"""


def _get_conn(use_db: bool = True):
    return pymysql.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD or None,
        database=MYSQL_DATABASE if use_db else None,
        port=MYSQL_PORT,
        charset="utf8mb4",
    )


def _ensure_database():
    """DB가 없으면 생성."""
    conn = _get_conn(use_db=False)
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DATABASE}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        conn.commit()
    finally:
        conn.close()


def _ensure_tables():
    """테이블 없으면 생성."""
    conn = _get_conn(use_db=True)
    try:
        for stmt in TABLES_SQL.strip().split(";"):
            stmt = stmt.strip()
            if not stmt or stmt.startswith("--"):
                continue
            with conn.cursor() as cur:
                cur.execute(stmt)
        conn.commit()
    finally:
        conn.close()


def _ensure_posts_view_count():
    """기존 DB에 posts.view_count 컬럼이 없으면 추가."""
    conn = _get_conn(use_db=True)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'view_count'",
                (MYSQL_DATABASE,),
            )
            if cur.fetchone() is None:
                cur.execute(
                    "ALTER TABLE posts ADD COLUMN view_count INT DEFAULT 0 COMMENT '조회수'"
                )
                conn.commit()
                logger.info("posts.view_count 컬럼 추가됨")
    finally:
        conn.close()


def _ensure_posts_prefix_id():
    """기존 DB에 post_prefixes 테이블 및 posts.prefix_id 컬럼이 없으면 추가."""
    conn = _get_conn(use_db=True)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM information_schema.TABLES "
                "WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'post_prefixes'",
                (MYSQL_DATABASE,),
            )
            if cur.fetchone() is None:
                cur.execute("""
                    CREATE TABLE post_prefixes (
                      id BIGINT AUTO_INCREMENT PRIMARY KEY,
                      name VARCHAR(20) NOT NULL COMMENT '말머리 이름 (최대 20자)',
                      sort_order INT DEFAULT 0 COMMENT '노출 순서',
                      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    ) COMMENT='게시글 말머리'
                """)
                conn.commit()
                logger.info("post_prefixes 테이블 생성됨")
            cur.execute(
                "SELECT 1 FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'prefix_id'",
                (MYSQL_DATABASE,),
            )
            if cur.fetchone() is None:
                cur.execute(
                    "ALTER TABLE posts ADD COLUMN prefix_id BIGINT NULL COMMENT '말머리 ID' AFTER category_id"
                )
                cur.execute(
                    "ALTER TABLE posts ADD FOREIGN KEY (prefix_id) REFERENCES post_prefixes(id) ON DELETE SET NULL"
                )
                conn.commit()
                logger.info("posts.prefix_id 컬럼 추가됨")
    finally:
        conn.close()


def _ensure_career_extension_tables():
    """경력 확장 테이블(career_links, career_highlights, career_tags) 없으면 생성."""
    conn = _get_conn(use_db=True)
    try:
        with conn.cursor() as cur:
            for table in ("career_links", "career_highlights", "career_tags"):
                cur.execute(
                    "SELECT 1 FROM information_schema.TABLES "
                    "WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s",
                    (MYSQL_DATABASE, table),
                )
                if cur.fetchone() is not None:
                    continue
                if table == "career_links":
                    cur.execute("""
                        CREATE TABLE career_links (
                          id BIGINT AUTO_INCREMENT PRIMARY KEY,
                          career_id BIGINT NOT NULL COMMENT '경력 ID',
                          link_name VARCHAR(50) NOT NULL COMMENT '버튼명',
                          link_url VARCHAR(500) NOT NULL COMMENT '이동 URL',
                          sort_order INT DEFAULT 0 COMMENT '버튼 순서',
                          FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE CASCADE
                        ) COMMENT='경력 관련 링크들'
                    """)
                elif table == "career_highlights":
                    cur.execute("""
                        CREATE TABLE career_highlights (
                          id BIGINT AUTO_INCREMENT PRIMARY KEY,
                          career_id BIGINT NOT NULL COMMENT '경력 ID',
                          content VARCHAR(500) NOT NULL COMMENT '한 일 항목 (개조식)',
                          sort_order INT DEFAULT 0 COMMENT '노출 순서',
                          FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE CASCADE
                        ) COMMENT='경력 한 일 (최대 5개)'
                    """)
                else:  # career_tags
                    cur.execute("""
                        CREATE TABLE career_tags (
                          career_id BIGINT NOT NULL,
                          tag_id BIGINT NOT NULL,
                          PRIMARY KEY (career_id, tag_id),
                          FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE CASCADE,
                          FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
                        ) COMMENT='경력-태그 N:M (최대 5개)'
                    """)
                conn.commit()
                logger.info("%s 테이블 생성됨", table)
    finally:
        conn.close()


def _ensure_site_settings():
    """site_settings 테이블 없으면 생성 (프로젝트/경력 소개 문구 등)."""
    conn = _get_conn(use_db=True)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM information_schema.TABLES "
                "WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'site_settings'",
                (MYSQL_DATABASE,),
            )
            if cur.fetchone() is None:
                cur.execute("""
                    CREATE TABLE site_settings (
                      `key` VARCHAR(64) NOT NULL PRIMARY KEY COMMENT '설정 키',
                      value VARCHAR(255) NULL COMMENT '값 (예: 프로젝트/경력 소개 문구 최대 20자)',
                      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    ) COMMENT='사이트 설정 (키-값)'
                """)
                conn.commit()
                logger.info("site_settings 테이블 생성됨")
    finally:
        conn.close()


def _ensure_admin():
    """env 관리자 계정이 없을 때만 생성. 있으면 아무것도 하지 않음."""
    conn = _get_conn(use_db=True)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE email = %s", (SEED_ADMIN_EMAIL,))
            if cur.fetchone() is None:
                password_hash = bcrypt.hashpw(
                    SEED_ADMIN_PASSWORD.encode("utf-8"), bcrypt.gensalt()
                ).decode("utf-8")
                cur.execute(
                    "INSERT INTO users (email, password_hash, name) VALUES (%s, %s, %s)",
                    (SEED_ADMIN_EMAIL, password_hash, SEED_ADMIN_NAME),
                )
                conn.commit()
                logger.info("관리자 계정 생성: %s", SEED_ADMIN_EMAIL)
    finally:
        conn.close()


def init_on_startup():
    """서버 시작 시 호출: DB·테이블 생성, 관리자 없으면 생성."""
    try:
        _ensure_database()
        _ensure_tables()
        _ensure_posts_view_count()
        _ensure_posts_prefix_id()
        _ensure_career_extension_tables()
        _ensure_site_settings()
        _ensure_admin()
    except Exception as e:
        logger.exception("DB 초기화 실패: %s", e)
        raise
