"""API 설정 - 환경변수 기반."""
import os
from pathlib import Path

from dotenv import load_dotenv

# 루트 기준 .env (jungeui/.env)
_env_path = Path(__file__).resolve().parents[3]
load_dotenv(_env_path / ".env")

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "ejlab")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "jungeui")

DATABASE_URL = (
    f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}"
)

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24h (로그인 유지 미선택 시)
ACCESS_TOKEN_EXPIRE_DAYS_REMEMBER = 30  # 로그인 유지 선택 시 최대 30일

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads")).resolve()
if not UPLOAD_DIR.is_absolute():
    UPLOAD_DIR = _env_path / UPLOAD_DIR

CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5181,http://localhost:5182,https://admin.jungeui.net,https://jungeui.net",
).split(",")

# www → naked 301 리다이렉트 (REDIRECT_WWW_TO_NAKED=true 일 때만, 로컬에서는 비활성)
REDIRECT_WWW_TO_NAKED = os.getenv("REDIRECT_WWW_TO_NAKED", "false").lower() in ("true", "1")
WWW_HOST = os.getenv("WWW_HOST", "www.jungeui.net")
NAKED_HOST = os.getenv("NAKED_HOST", "jungeui.net")
