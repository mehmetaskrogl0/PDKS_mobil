from pydantic import BaseModel
from datetime import date, datetime



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


class AttendanceCreate(BaseModel):

    latitude: float
    longitude: float

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