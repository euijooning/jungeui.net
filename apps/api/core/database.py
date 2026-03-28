"""DB 연결 - SQLAlchemy 세션."""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from apps.api.core.config import DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=False,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
