"""Emergent glue: wraps reference backend under /api prefix + CORS + seed.
User does NOT push this file to GitHub — it's only for running the ref backend
on Emergent preview. Reference `app/` folder is verbatim from user's repo.
"""
import os
from datetime import datetime
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.database import engine, Base, SessionLocal
from app.models import User, Workplace
from app.security import hash_password
from app.routers import auth, users, attendance, workplace, dashboard, leave, reports


def migrate_mysql_schema():
    if engine.url.get_backend_name() != "mysql":
        return

    inspector = inspect(engine)
    attendance_columns = {column["name"] for column in inspector.get_columns("attendance")}

    statements = []
    if "overtime_minutes" not in attendance_columns:
        statements.append("ALTER TABLE attendance ADD COLUMN overtime_minutes INTEGER NOT NULL DEFAULT 0")
    if "missing_minutes" not in attendance_columns:
        statements.append("ALTER TABLE attendance ADD COLUMN missing_minutes INTEGER NOT NULL DEFAULT 0")

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def seed():
    Base.metadata.create_all(bind=engine)
    migrate_mysql_schema()
    db: Session = SessionLocal()
    try:
        # Seed admin
        admin_email = os.getenv("FIRST_ADMIN_EMAIL", "admin@atlaspdks.com")
        admin_pw = os.getenv("FIRST_ADMIN_PASSWORD", "Admin1234!")
        admin_name = os.getenv("FIRST_ADMIN_NAME", "Emre Yilmaz").split(" ", 1)
        # Seed default workplace first
        wp = db.query(Workplace).filter(Workplace.name == "Kale Kapi Ofis").first()
        if not wp:
            wp = Workplace(
                name="Kale Kapi Ofis",
                latitude=float(os.getenv("WORKPLACE_LAT", "41.0082")),
                longitude=float(os.getenv("WORKPLACE_LNG", "28.9784")),
                radius=int(os.getenv("WORKPLACE_RADIUS_M", "150")),
                start_time=os.getenv("SHIFT_START", "09:00"),
            )
            db.add(wp); db.commit(); db.refresh(wp)
        # Seed admin
        u = db.query(User).filter(User.email == admin_email).first()
        if not u:
            u = User(
                name=admin_name[0],
                surname=admin_name[1] if len(admin_name) > 1 else "",
                email=admin_email,
                password=hash_password(admin_pw),
                role="admin",
                workplace_id=wp.id,
            )
            db.add(u); db.commit()
        # Assign default workplace to employees without one
        db.query(User).filter(User.workplace_id.is_(None)).update({User.workplace_id: wp.id})
        db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    seed()
    yield

# Reference backend defines a bare-bones FastAPI. Emergent needs /api prefix + CORS.
app = FastAPI(
    title="PDKS API (Emergent Preview)",
    description="Konum tabanlı personel takip sistemi",
    version="1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Emergent ingress only forwards /api/* to port 8001. We wrap each router.
for r in (auth, users, attendance, workplace, dashboard, leave, reports):
    app.include_router(r.router, prefix="/api")


@app.get("/")
def root():
    return {"app": "PDKS", "status": "ok", "note": "Reference backend running under /api prefix"}
