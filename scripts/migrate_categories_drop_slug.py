"""
기존 DB에서 categories.slug 컬럼 제거.
실행: python scripts/migrate_categories_drop_slug.py
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


def main():
    conn = pymysql.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD or None,
        port=MYSQL_PORT,
        database=MYSQL_DATABASE,
        charset="utf8mb4",
    )
    try:
        with conn.cursor() as cur:
            cur.execute("ALTER TABLE categories DROP COLUMN slug")
        conn.commit()
        print("categories.slug 컬럼 제거 완료.")
    except Exception as e:
        if "Unknown column" in str(e) or "check that column" in str(e).lower():
            print("slug 컬럼이 없거나 이미 제거되었습니다. 스킵.")
        else:
            raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
