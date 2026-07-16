from fastapi import FastAPI

from .database import engine, Base
from . import models
from .routers import auth
from .routers import users
from .routers import attendance
from .routers import workplace
from app.routers import dashboard
from .routers import leave
from .routers import reports
from fastapi.middleware.cors import CORSMiddleware
from .routers import teams

app = FastAPI(
    title="PDKS API",
    description="Konum tabanlı personel takip sistemi",
    version="1.0"
)

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
Base.metadata.create_all(bind=engine)


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(attendance.router)
app.include_router(workplace.router)
app.include_router(dashboard.router)
app.include_router(leave.router)
app.include_router(reports.router)
app.include_router(teams.router)

@app.get("/")
def home():
    return {
        "message": "PDKS Backend çalışıyor"
    }