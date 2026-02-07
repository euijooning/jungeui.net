"""
기존 DB에 categories.parent_id 컬럼 추가.
실행: python scripts/migrate_categories_add_parent_id.py
기존 카테고리는 모두 parent_id=NULL(대카테고리)로 유지됩니다.
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
            cur.execute("""
                ALTER TABLE categories
                ADD COLUMN parent_id BIGINT NULL COMMENT '상위 카테고리 ID (NULL=대카테고리)' AFTER id,
                ADD CONSTRAINT fk_categories_parent
                    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
            """)
        conn.commit()
        print("categories.parent_id 컬럼 추가 완료. 기존 행은 parent_id=NULL 유지.")
    except Exception as e:
        if "Duplicate column" in str(e) or "1060" in str(e):
            print("parent_id 컬럼이 이미 존재합니다. 스킵.")
        else:
            raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
