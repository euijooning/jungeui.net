"""
기존 DB에 about_messages 테이블 추가.
사용: python scripts/migrate_about_messages.py
환경변수: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
"""
import os
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

SQL = """
CREATE TABLE IF NOT EXISTS about_messages (
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
        database=MYSQL_DATABASE,
        port=MYSQL_PORT,
        charset="utf8mb4",
    )
    try:
        with conn.cursor() as cur:
            cur.execute(SQL)
        conn.commit()
        print("about_messages 테이블 마이그레이션 완료.")
    except Exception as e:
        print("오류:", e)
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
