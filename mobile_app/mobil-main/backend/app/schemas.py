from pydantic import BaseModel
from datetime import date, datetime


# =========================
# AUTH / USER
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



class UserResponse(BaseModel):

    id: int
    name: str
    surname: str
    email: str
    role: str
    workplace_id: int | None = None


    class Config:

        from_attributes = True




class UserActionResponse(BaseModel):

    message: str
    user_id: int | None = None





# =========================
# WORKPLACE
# =========================


class WorkplaceCreate(BaseModel):

    name: str
    latitude: float
    longitude: float
    radius: int
    start_time: str



class WorkplaceResponse(BaseModel):

    id: int
    name: str
    latitude: float
    longitude: float
    radius: int
    start_time: str


    class Config:

        from_attributes = True



class WorkplaceActionResponse(BaseModel):

    message: str
    workplace_id: int | None = None





# =========================
# ATTENDANCE
# =========================


class AttendanceCreate(BaseModel):

    latitude: float
    longitude: float




class AttendanceCheckResponse(BaseModel):

    message: str

    distance: float | None = None

    workplace: str | None = None

    late: bool | None = None

    late_minutes: int | None = None

    overtime_minutes: int | None = None

    missing_minutes: int | None = None




class AttendanceHistoryResponse(BaseModel):

    id: int

    check_in: datetime

    check_out: datetime | None = None

    duration: str | None = None

    late: bool

    late_minutes: int

    overtime_minutes: int

    missing_minutes: int




class AdminAttendanceResponse(BaseModel):

    personel: str

    email: str

    check_in: datetime

    check_out: datetime | None = None

    late: bool

    late_minutes: int

    overtime_minutes: int

    missing_minutes: int




class LateAttendanceResponse(BaseModel):

    personel: str

    email: str

    check_in: datetime

    late_minutes: int




class TodayAttendanceResponse(BaseModel):

    personel: str

    email: str

    check_in: datetime

    check_out: datetime | None = None

    late: bool

    late_minutes: int

    overtime_minutes: int

    missing_minutes: int




class ActiveAttendanceResponse(BaseModel):

    personel: str

    email: str

    check_in: datetime




class UserAttendanceRecordResponse(BaseModel):

    check_in: datetime

    check_out: datetime | None = None

    duration: str | None = None

    late: bool

    late_minutes: int

    overtime_minutes: int

    missing_minutes: int




class UserAttendanceResponse(BaseModel):

    personel: str

    records: list[UserAttendanceRecordResponse]





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




class LeaveActionResponse(BaseModel):

    message: str

    leave_id: int | None = None


# =========================
# LEAVE RESPONSE
# =========================


class LeaveActionResponse(BaseModel):

    message: str

    leave_id: int | None = None




class AdminLeaveResponse(BaseModel):

    id: int

    personel: str

    email: str

    start_date: date

    end_date: date

    reason: str

    status: str

    created_at: datetime




class PendingLeaveResponse(BaseModel):

    id: int

    user_id: int

    start_date: date

    end_date: date

    reason: str

    status: str

    created_at: datetime


# =========================
# REPORTS
# =========================


class EmployeeReportResponse(BaseModel):

    user_id: int

    personel: str

    ay: str

    calisma_gunu: int

    toplam_saat: str

    gecikme_sayisi: int

    gecikme_dakika: int

    izin_gunu: int

    fazla_mesai_dakika: int

    eksik_mesai_dakika: int





# =========================
# SYSTEM LOG
# =========================


class SystemLogResponse(BaseModel):

    id: int

    user_id: int | None = None

    action: str

    description: str | None = None

    created_at: datetime



    class Config:

        from_attributes = True