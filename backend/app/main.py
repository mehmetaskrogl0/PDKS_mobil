from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from . import models

from .routers import auth
from .routers import users
from .routers import attendance
from .routers import workplace
from .routers import dashboard
from .routers import leave
from .routers import reports
from .routers import teams
from .routers import shifts
from .routers import organization

Base.metadata.create_all(
    bind=engine
)


app = FastAPI(
    title="PDKS API",
    description="Konum tabanlı personel takip sistemi",
    version="1.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(attendance.router)
app.include_router(workplace.router)
app.include_router(dashboard.router)
app.include_router(leave.router)
app.include_router(reports.router)
app.include_router(teams.router)
app.include_router(shifts.router)
app.include_router(organization.router)


@app.get("/")
def home():

    return {
        "message": "PDKS Backend çalışıyor"
    }