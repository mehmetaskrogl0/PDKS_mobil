from pydantic import BaseModel, Field
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
    team_id: int | None = None

    job_title: str | None = None
    job_description: str | None = None



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
    team_id: int | None = None

    job_title: str | None = None
    job_description: str | None = None



class UserResponse(BaseModel):

    id: int

    name: str
    surname: str
    email: str
    role: str

    workplace_id: int | None = None
    workplace_name: str | None = None

    team_id: int | None = None
    team_name: str | None = None

    job_title: str | None = None
    job_description: str | None = None

    is_team_leader: bool = False


    class Config:

        from_attributes = True



class UserActionResponse(BaseModel):

    message: str
    user_id: int | None = None



class UserSimpleResponse(BaseModel):

    id: int

    name: str
    surname: str
    email: str

    role: str

    workplace_id: int | None = None
    workplace_name: str | None = None

    team_id: int | None = None
    team_name: str | None = None

    job_title: str | None = None
    job_description: str | None = None


    class Config:

        from_attributes = True



# =========================
# TEAM
# =========================


class TeamCreate(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=100
    )

    description: str | None = Field(
        default=None,
        max_length=500
    )

    leader_id: int | None = None
    workplace_id: int | None = None



class TeamUpdate(BaseModel):

    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    description: str | None = Field(
        default=None,
        max_length=500
    )

    leader_id: int | None = None
    workplace_id: int | None = None



class TeamMemberAssign(BaseModel):

    user_id: int

    job_title: str | None = Field(
        default=None,
        max_length=100
    )

    job_description: str | None = Field(
        default=None,
        max_length=500
    )



class TeamMemberUpdate(BaseModel):

    job_title: str | None = Field(
        default=None,
        max_length=100
    )

    job_description: str | None = Field(
        default=None,
        max_length=500
    )



class TeamLeaderAssign(BaseModel):

    leader_id: int | None = None



class TeamMemberResponse(BaseModel):

    id: int

    name: str
    surname: str
    email: str

    role: str

    workplace_id: int | None = None
    workplace_name: str | None = None

    team_id: int | None = None
    team_name: str | None = None

    job_title: str | None = None
    job_description: str | None = None

    is_team_leader: bool = False


    class Config:

        from_attributes = True



class TeamResponse(BaseModel):

    id: int

    name: str
    description: str | None = None

    leader_id: int | None = None
    leader_name: str | None = None

    workplace_id: int | None = None
    workplace_name: str | None = None

    member_count: int = 0

    created_at: datetime
    updated_at: datetime


    class Config:

        from_attributes = True



class TeamDetailResponse(BaseModel):

    id: int

    name: str
    description: str | None = None

    leader_id: int | None = None
    leader_name: str | None = None

    workplace_id: int | None = None
    workplace_name: str | None = None

    member_count: int = 0

    created_at: datetime
    updated_at: datetime

    members: list[TeamMemberResponse] = []


    class Config:

        from_attributes = True



class TeamActionResponse(BaseModel):

    message: str

    team_id: int | None = None
    user_id: int | None = None



class TeamAttendanceMemberResponse(BaseModel):

    user_id: int

    personel: str
    email: str

    job_title: str | None = None

    attendance_status: str

    check_in: datetime | None = None
    check_out: datetime | None = None

    late: bool = False
    late_minutes: int = 0

    overtime_minutes: int = 0
    missing_minutes: int = 0

    on_leave: bool = False



class TeamAttendanceSummaryResponse(BaseModel):

    team_id: int
    team_name: str

    leader_id: int | None = None
    leader_name: str | None = None

    total_members: int

    working_count: int
    not_working_count: int
    on_leave_count: int
    late_count: int

    members: list[TeamAttendanceMemberResponse]



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

    records: list[
        UserAttendanceRecordResponse
    ]



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