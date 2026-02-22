"""API 설정 - 환경변수 기반."""
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import load_dotenv

# 루트 기준 .env / .env.staging — ENV에 따라 한 개만 로드
# parents[3]: config.py → core(0), api(1), apps(2) → parents[3]=프로젝트 루트(.env 위치)
# load_dotenv: 이미 설정된 시스템 환경변수는 덮어쓰지 않음 (배포 설정 > .env 파일)
_env_path = Path(__file__).resolve().parents[3]
_env = os.getenv("ENV", "production").strip().lower()
_env_file = ".env.staging" if _env == "staging" else ".env"
load_dotenv(_env_path / _env_file)

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "ejlab")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "jungeui")
# 비밀번호 특수문자(@, #, / 등) 시 URL 파싱 깨짐 방지 (실무 복잡도 규칙 대응)
_encoded_password = quote_plus(MYSQL_PASSWORD)

DATABASE_URL = (
    f"mysql+pymysql://{MYSQL_USER}:{_encoded_password}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}"
)

# production/staging: SECRET_KEY 필수. 미설정 시 기동 거부 (보안 필수)
_raw_secret = os.getenv("SECRET_KEY", "").strip()
if _env in ("production", "staging"):
    if not _raw_secret:
        raise SystemExit("SECRET_KEY must be set when ENV=production or ENV=staging. Set it in .env or .env.staging.")
SECRET_KEY = _raw_secret if _raw_secret else os.getenv("SECRET_KEY", "dev-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24h (로그인 유지 미선택 시)
ACCESS_TOKEN_EXPIRE_DAYS_REMEMBER = 30  # 로그인 유지 선택 시 최대 30일

# docs/guides/common/07-deploy-strategy.md: 전부 프로젝트 루트의 uploads 하위. 상대 경로면 해당 디렉터리(루트) 기준. 없으면 생성.
_upload_dir_env = (os.getenv("UPLOAD_DIR", "uploads") or "uploads").strip() or "uploads"
UPLOAD_DIR = Path(_upload_dir_env)
if not UPLOAD_DIR.is_absolute():
    UPLOAD_DIR = (_env_path / _upload_dir_env).resolve()
else:
    UPLOAD_DIR = UPLOAD_DIR.resolve()
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5181,http://localhost:5182,https://admin.jungeui.net,https://jungeui.net",
).split(",")

# www → naked 301 리다이렉트 (REDIRECT_WWW_TO_NAKED=true 일 때만, 로컬에서는 비활성)
REDIRECT_WWW_TO_NAKED = os.getenv("REDIRECT_WWW_TO_NAKED", "false").lower() in ("true", "1")
WWW_HOST = os.getenv("WWW_HOST", "www.jungeui.net")
NAKED_HOST = os.getenv("NAKED_HOST", "jungeui.net")

# 타임존 (방문 통계 등 날짜 기준)
TIMEZONE_OFFSET_HOURS = int(os.getenv("TIMEZONE_OFFSET_HOURS", "9"))


def get_today_iso() -> str:
    """현재 날짜를 TIMEZONE_OFFSET_HOURS 기준 ISO 문자열로 반환."""
    tz = timezone(timedelta(hours=TIMEZONE_OFFSET_HOURS))
    return datetime.now(tz).date().isoformat()
