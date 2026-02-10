"""
Jungeui Lab - 초기 데이터 시딩 (관리자, 카테고리).
사용: python scripts/seed_data.py
실행 전 scripts/db_reset.py 로 DB 리셋 가능. 평소에는 서버 기동 시 자동으로 테이블·시드가 적용됨.
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
            # 관리자 (없으면 생성, 있으면 .env 비밀번호/이름으로 갱신)
            cur.execute("SELECT id FROM users WHERE email = %s", (SEED_ADMIN_EMAIL,))
            row = cur.fetchone()
            if row is None:
                cur.execute(
                    "INSERT INTO users (email, password_hash, name) VALUES (%s, %s, %s)",
                    (SEED_ADMIN_EMAIL, password_hash, SEED_ADMIN_NAME),
                )
                print("관리자 계정 생성:", SEED_ADMIN_EMAIL)
            else:
                cur.execute(
                    "UPDATE users SET password_hash = %s, name = %s WHERE email = %s",
                    (password_hash, SEED_ADMIN_NAME, SEED_ADMIN_EMAIL),
                )
                print("관리자 계정 비밀번호/이름 갱신:", SEED_ADMIN_EMAIL)

            # 기본 카테고리 (없을 때만)
            categories = [
                ("기획 (Planning)", 1),
                ("개발 (Dev)", 2),
                ("에세이 (Essay)", 3),
            ]
            for name, order in categories:
                cur.execute(
                    "SELECT id FROM categories WHERE name = %s AND parent_id IS NULL", (name,)
                )
                if cur.fetchone() is None:
                    cur.execute(
                        "INSERT INTO categories (parent_id, name, sort_order) VALUES (NULL, %s, %s)",
                        (name, order),
                    )
                    print("카테고리 생성:", name)

            # about_messages (없을 때만)
            cur.execute("SELECT COUNT(*) FROM about_messages")
            if cur.fetchone()[0] == 0:
                messages = [
                    ("과거", "이전 경험과 학습의 여정을 담았습니다.", 0),
                    ("현재", "지금의 나와 관심사를 나눕니다.", 1),
                    ("미래", "앞으로의 방향과 비전을 그립니다.", 2),
                ]
                for title, content, order in messages:
                    cur.execute(
                        "INSERT INTO about_messages (title, content, sort_order) VALUES (%s, %s, %s)",
                        (title, content, order),
                    )
                    print("about_messages 시드 생성:", title)
        conn.commit()
        print("시드 데이터 적용 완료.")
    except Exception as e:
        print("오류:", e)
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
