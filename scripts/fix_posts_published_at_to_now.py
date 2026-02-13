"""
등록일(created_at) > 발행일(published_at) 인 행을 정합성 맞추기 위해
발행일·수정일을 현시점(NOW())으로 한 번만 갱신하는 마이그레이션.

사용: python scripts/fix_posts_published_at_to_now.py
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

UPDATE_SQL = """
UPDATE posts
SET published_at = NOW(), updated_at = NOW()
WHERE published_at IS NOT NULL AND created_at > published_at
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
            cur.execute(UPDATE_SQL)
            affected = cur.rowcount
        conn.commit()
        print(f"정합성 정리 완료: {affected}건 갱신 (published_at, updated_at → NOW())")
    except Exception as e:
        print("오류:", e)
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
