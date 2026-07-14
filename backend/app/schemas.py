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



class UserLogin(BaseModel):

    email: str
    password: str



class Token(BaseModel):

    access_token: str
    token_type: str



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