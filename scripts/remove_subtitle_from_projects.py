"""
projects 테이블에서 subtitle 컬럼 제거.
사용: python scripts/remove_subtitle_from_projects.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()

import pymysql

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "ejlab")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "jungeui")


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
            cur.execute("""
                SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'subtitle'
            """, (MYSQL_DATABASE,))
            exists = cur.fetchone()[0] > 0
        if not exists:
            print("subtitle 컬럼이 이미 없습니다.")
            return
        with conn.cursor() as cur:
            cur.execute("ALTER TABLE projects DROP COLUMN subtitle")
        conn.commit()
        print("projects.subtitle 컬럼 제거 완료.")
    except Exception as e:
        print("오류:", e)
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
