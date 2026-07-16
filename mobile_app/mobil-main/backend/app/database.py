"""Reference database.py — MySQL default, env override for SQLite (Emergent dev).
Users pushing this to GitHub can override via DATABASE_URL env var to keep MySQL config.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


# MySQL is the source of truth for persistence.
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:Mehmet042@localhost:3306/pdks_db")

engine_kwargs = {}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_kwargs)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
