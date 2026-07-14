from pydantic import BaseModel
from datetime import date, datetime


# =========================
# USER
# =========================

class UserCreate(BaseModel):

    name: str
    surname: str
    email: str
    password: str



class AdminUserCreate(BaseModel):

    name: str
    surname: str
    email: str
    password: str
    role: str = "employee"
    workplace_id: int | None = None



class UserLogin(BaseModel):

    email: str
    password: str



class Token(BaseModel):

    access_token: str
    token_type: str

class UserUpdate(BaseModel):

    name: str | None = None
    surname: str | None = None
    email: str | None = None
    password: str | None = None
    role: str | None = None
    workplace_id: int | None = None


# =========================
# ATTENDANCE
# =========================

class AttendanceCreate(BaseModel):

    latitude: float
    longitude: float



# =========================
# WORKPLACE
# =========================

class WorkplaceCreate(BaseModel):

    name: str
    latitude: float
    longitude: float
    radius: int
    start_time: str   # Örnek: 09:00



class WorkplaceResponse(BaseModel):

    id: int
    name: str
    latitude: float
    longitude: float
    radius: int
    start_time: str


    class Config:
        from_attributes = True



# =========================
# LEAVE
# =========================

class LeaveCreate(BaseModel):

    start_date: date
    end_date: date
    reason: str



class LeaveResponse(BaseModel):

    id: int
    user_id: int
    start_date: date
    end_date: date
    reason: str
    status: str
    created_at: datetime


    class Config:
        from_attributes = True

    
