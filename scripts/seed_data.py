"""
Jungeui Lab - 초기 데이터 시딩 (관리자, 카테고리).
사용: python scripts/seed_data.py
실행 전 scripts/db_init.py 로 테이블 생성 필요.
환경변수: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import pymysql
    import bcrypt
    from dotenv import load_dotenv
except ImportError:
    print("pip install pymysql bcrypt python-dotenv 후 실행하세요.")
    sys.exit(1)

load_dotenv()

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_USER = os.getenv("MYSQL_USER", "ejlab")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "jungeui")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))

# 시드 비밀번호 (실서비스에서는 반드시 변경)
SEED_ADMIN_EMAIL = os.getenv("SEED_ADMIN_EMAIL", "ej@jungeui.net")
SEED_ADMIN_PASSWORD = os.getenv("SEED_ADMIN_PASSWORD", "changeme")
SEED_ADMIN_NAME = os.getenv("SEED_ADMIN_NAME", "정의준")


def main():
    password_hash = bcrypt.hashpw(
        SEED_ADMIN_PASSWORD.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")

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
            # 관리자 (이미 있으면 스킵)
            cur.execute("SELECT id FROM users WHERE email = %s", (SEED_ADMIN_EMAIL,))
            if cur.fetchone() is None:
                cur.execute(
                    "INSERT INTO users (email, password_hash, name) VALUES (%s, %s, %s)",
                    (SEED_ADMIN_EMAIL, password_hash, SEED_ADMIN_NAME),
                )
                print("관리자 계정 생성:", SEED_ADMIN_EMAIL)
            else:
                print("관리자 계정 이미 존재:", SEED_ADMIN_EMAIL)

            # 기본 카테고리 (없을 때만)
            categories = [
                ("기획 (Planning)", "planning", 1),
                ("개발 (Dev)", "dev", 2),
                ("에세이 (Essay)", "essay", 3),
            ]
            for name, slug, order in categories:
                cur.execute(
                    "SELECT id FROM categories WHERE slug = %s", (slug,)
                )
                if cur.fetchone() is None:
                    cur.execute(
                        "INSERT INTO categories (name, slug, sort_order) VALUES (%s, %s, %s)",
                        (name, slug, order),
                    )
                    print("카테고리 생성:", name)
        conn.commit()
        print("시드 데이터 적용 완료.")
    except Exception as e:
        print("오류:", e)
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
