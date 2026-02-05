"""
기존 DB에 post_attachments 테이블 추가 (한 번만 실행).
사용: python scripts/migrate_post_attachments.py
환경변수: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE (기본 jungeui), MYSQL_PORT
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import pymysql
    from dotenv import load_dotenv
except ImportError:
    print("pip install pymysql python-dotenv 후 실행하세요.")
    sys.exit(1)

load_dotenv()

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_USER = os.getenv("MYSQL_USER", "ejlab")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "jungeui")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))

if not re.match(r"^[a-zA-Z0-9_]+$", MYSQL_DATABASE):
    print("MYSQL_DATABASE는 영문, 숫자, 언더스코어만 허용됩니다.")
    sys.exit(1)

SQL = """
CREATE TABLE IF NOT EXISTS post_attachments (
  post_id BIGINT NOT NULL,
  asset_id BIGINT NOT NULL,
  sort_order INT DEFAULT 0 COMMENT '노출 순서',
  PRIMARY KEY (post_id, asset_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
) COMMENT='게시글 첨부파일 (다중)';
"""


def main():
    conn = pymysql.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD or None,
        port=MYSQL_PORT,
        charset="utf8mb4",
        database=MYSQL_DATABASE,
    )
    try:
        with conn.cursor() as cur:
            cur.execute(SQL)
        conn.commit()
        print(f"post_attachments 테이블 생성 완료: {MYSQL_DATABASE}")
    except Exception as e:
        print("오류:", e)
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
