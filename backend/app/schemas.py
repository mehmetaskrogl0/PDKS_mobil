from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


# ==================================================
# ORTAK AYAR
# ==================================================


class ORMBaseModel(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )




# ==================================================
# ORTAK İŞLEM CEVAPLARI
# ==================================================


class UserActionResponse(BaseModel):

    message: str

    user_id: int | None = None


class WorkplaceActionResponse(BaseModel):

    message: str

    workplace_id: int | None = None


class LeaveActionResponse(BaseModel):

    message: str

    leave_id: int | None = None


class TeamActionResponse(BaseModel):

    message: str

    team_id: int | None = None


class ShiftActionResponse(BaseModel):

    message: str

    shift_id: int | None = None


class ShiftAssignmentActionResponse(BaseModel):

    message: str

    assignment_id: int | None = None


# ==================================================
# AUTH / USER
# ==================================================


class UserCreate(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=50
    )

    surname: str = Field(
        min_length=2,
        max_length=50
    )

    email: EmailStr

    password: str = Field(
        min_length=6,
        max_length=128
    )


class AdminUserCreate(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=50
    )

    surname: str = Field(
        min_length=2,
        max_length=50
    )

    email: EmailStr

    password: str = Field(
        min_length=6,
        max_length=128
    )

    role: str = "personnel"

    workplace_id: int | None = None

    team_id: int | None = None

    job_title: str | None = Field(
        default=None,
        max_length=100
    )

    job_description: str | None = Field(
        default=None,
        max_length=500
    )

    department_id: int | None = None

    directorate_id: int | None = None

    organization_unit_id: int | None = None

    job_title_id: int | None = None


class UserLogin(BaseModel):

    email: EmailStr

    password: str


class Token(BaseModel):

    access_token: str

    token_type: str


class UserUpdate(BaseModel):

    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=50
    )

    surname: str | None = Field(
        default=None,
        min_length=2,
        max_length=50
    )

    email: EmailStr | None = None

    password: str | None = Field(
        default=None,
        min_length=6,
        max_length=128
    )

    role: str | None = None

    workplace_id: int | None = None

    team_id: int | None = None

    job_title: str | None = Field(
        default=None,
        max_length=100
    )

    job_description: str | None = Field(
        default=None,
        max_length=500
    )

    department_id: int | None = None

    directorate_id: int | None = None

    organization_unit_id: int | None = None

    job_title_id: int | None = None


class UserResponse(ORMBaseModel):

    id: int

    name: str

    surname: str

    email: EmailStr

    role: str

    workplace_id: int | None = None

    workplace_name: str | None = None

    team_id: int | None = None

    team_name: str | None = None

    job_title: str | None = None

    job_description: str | None = None

    department_id: int | None = None

    department_name: str | None = None

    directorate_id: int | None = None

    directorate_name: str | None = None

    organization_unit_id: int | None = None

    organization_unit_name: str | None = None

    job_title_id: int | None = None

    job_title_name: str | None = None

    is_team_leader: bool = False


class UserDetailResponse(UserResponse):

    full_name: str | None = None


# ==================================================
# WORKPLACE
# ==================================================


class WorkplaceCreate(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=100
    )

    latitude: float

    longitude: float

    radius: int = Field(
        gt=0
    )

    start_time: str = Field(
        default="09:00",
        pattern=r"^([01]\d|2[0-3]):[0-5]\d$"
    )


class WorkplaceUpdate(BaseModel):

    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    latitude: float | None = None

    longitude: float | None = None

    radius: int | None = Field(
        default=None,
        gt=0
    )

    start_time: str | None = Field(
        default=None,
        pattern=r"^([01]\d|2[0-3]):[0-5]\d$"
    )


class WorkplaceResponse(ORMBaseModel):

    id: int

    name: str

    latitude: float

    longitude: float

    radius: int

    start_time: str | None = None


# ==================================================
# ATTENDANCE
# ==================================================


class AttendanceCreate(BaseModel):

    latitude: float

    longitude: float


class AttendanceCheckResponse(BaseModel):

    message: str

    attendance_id: int | None = None

    check_in_time: datetime | None = None

    check_out_time: datetime | None = None

    distance: float | None = None

    late: bool = False

    late_minutes: int = 0

    overtime_minutes: int = 0

    missing_minutes: int = 0


class AttendanceHistoryResponse(ORMBaseModel):

    id: int

    check_in_time: datetime

    check_out_time: datetime | None = None

    check_in_lat: float

    check_in_long: float

    check_out_lat: float | None = None

    check_out_long: float | None = None

    late: bool = False

    late_minutes: int = 0

    overtime_minutes: int = 0

    missing_minutes: int = 0


class AdminAttendanceResponse(AttendanceHistoryResponse):

    user_id: int

    user_name: str | None = None

    user_surname: str | None = None

    user_email: str | None = None


class LateAttendanceResponse(BaseModel):

    user_id: int

    name: str

    surname: str

    check_in_time: datetime

    late_minutes: int


# ==================================================
# LEAVE
# ==================================================


class LeaveCreate(BaseModel):

    start_date: date

    end_date: date

    reason: str = Field(
        min_length=2,
        max_length=255
    )

    @model_validator(mode="after")
    def validate_dates(self):

        if self.end_date < self.start_date:

            raise ValueError(
                "Bitiş tarihi başlangıç tarihinden önce olamaz."
            )

        return self


class LeaveStatusUpdate(BaseModel):

    status: str


class LeaveResponse(ORMBaseModel):

    id: int

    user_id: int

    start_date: date

    end_date: date

    reason: str

    status: str

    created_at: datetime | None = None

    user_name: str | None = None

    user_surname: str | None = None




class AdminLeaveResponse(LeaveResponse):

    user_email: EmailStr | None = None

    workplace_id: int | None = None

    workplace_name: str | None = None

    department_name: str | None = None

    directorate_name: str | None = None

    organization_unit_name: str | None = None


# ==================================================
# TEAM
# ==================================================


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


class TeamMemberAdd(BaseModel):

    user_ids: list[int]


class TeamMemberUpdate(BaseModel):

    job_title: str | None = Field(
        default=None,
        max_length=100
    )

    job_description: str | None = Field(
        default=None,
        max_length=500
    )


class TeamLeaderUpdate(BaseModel):

    leader_id: int | None = None


class TeamMemberResponse(BaseModel):

    id: int

    name: str

    surname: str

    email: EmailStr

    role: str

    team_id: int | None = None

    job_title: str | None = None

    job_description: str | None = None

    is_team_leader: bool = False


class TeamResponse(ORMBaseModel):

    id: int

    name: str

    description: str | None = None

    leader_id: int | None = None

    leader_name: str | None = None

    workplace_id: int | None = None

    workplace_name: str | None = None

    member_count: int = 0

    created_at: datetime | None = None

    updated_at: datetime | None = None


class TeamDetailResponse(TeamResponse):

    members: list[TeamMemberResponse] = []


# ==================================================
# SHIFT
# ==================================================


class ShiftCreate(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=100
    )

    description: str | None = Field(
        default=None,
        max_length=500
    )

    start_time: time

    end_time: time

    break_minutes: int = Field(
        default=0,
        ge=0
    )

    late_tolerance_minutes: int = Field(
        default=0,
        ge=0
    )

    early_check_in_minutes: int = Field(
        default=30,
        ge=0
    )

    overtime_tolerance_minutes: int = Field(
        default=0,
        ge=0
    )

    workplace_id: int | None = None

    is_active: bool = True


class ShiftUpdate(BaseModel):

    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    description: str | None = Field(
        default=None,
        max_length=500
    )

    start_time: time | None = None

    end_time: time | None = None

    break_minutes: int | None = Field(
        default=None,
        ge=0
    )

    late_tolerance_minutes: int | None = Field(
        default=None,
        ge=0
    )

    early_check_in_minutes: int | None = Field(
        default=None,
        ge=0
    )

    overtime_tolerance_minutes: int | None = Field(
        default=None,
        ge=0
    )

    workplace_id: int | None = None

    is_active: bool | None = None


class ShiftResponse(ORMBaseModel):

    id: int

    name: str

    description: str | None = None

    start_time: time

    end_time: time

    start_time_text: str | None = None

    end_time_text: str | None = None

    break_minutes: int

    late_tolerance_minutes: int

    early_check_in_minutes: int

    overtime_tolerance_minutes: int

    workplace_id: int | None = None

    workplace_name: str | None = None

    is_active: bool

    is_overnight: bool = False

    created_at: datetime | None = None

    updated_at: datetime | None = None


# ==================================================
# SHIFT ASSIGNMENT
# ==================================================


class ShiftAssignmentCreate(BaseModel):

    shift_id: int

    user_id: int | None = None

    team_id: int | None = None

    start_date: date

    end_date: date | None = None

    is_active: bool = True

    notes: str | None = Field(
        default=None,
        max_length=500
    )

    @model_validator(mode="after")
    def validate_assignment(self):

        if (
            self.user_id is None
            and self.team_id is None
        ):

            raise ValueError(
                "Personel veya ekip seçilmelidir."
            )

        if (
            self.user_id is not None
            and self.team_id is not None
        ):

            raise ValueError(
                "Aynı atamada hem personel hem ekip seçilemez."
            )

        if (
            self.end_date is not None
            and self.end_date < self.start_date
        ):

            raise ValueError(
                "Bitiş tarihi başlangıç tarihinden önce olamaz."
            )

        return self


class ShiftAssignmentUpdate(BaseModel):

    shift_id: int | None = None

    user_id: int | None = None

    team_id: int | None = None

    start_date: date | None = None

    end_date: date | None = None

    is_active: bool | None = None

    notes: str | None = Field(
        default=None,
        max_length=500
    )


class ShiftAssignmentResponse(ORMBaseModel):

    id: int

    shift_id: int

    shift_name: str | None = None

    user_id: int | None = None

    team_id: int | None = None

    assignment_type: str | None = None

    assigned_name: str | None = None

    start_date: date

    end_date: date | None = None

    is_active: bool

    notes: str | None = None

    created_at: datetime | None = None

    updated_at: datetime | None = None


# ==================================================
# DAİRE BAŞKANLIĞI
# ==================================================


class DepartmentCreate(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=150
    )

    code: str | None = Field(
        default=None,
        max_length=30
    )

    description: str | None = Field(
        default=None,
        max_length=500
    )

    is_active: bool = True


class DepartmentUpdate(BaseModel):

    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150
    )

    code: str | None = Field(
        default=None,
        max_length=30
    )

    description: str | None = Field(
        default=None,
        max_length=500
    )

    is_active: bool | None = None


class DepartmentResponse(ORMBaseModel):

    id: int

    name: str

    code: str | None = None

    description: str | None = None

    is_active: bool

    directorate_count: int = 0

    personnel_count: int = 0

    created_at: datetime | None = None

    updated_at: datetime | None = None


# ==================================================
# MÜDÜRLÜK
# ==================================================


class DirectorateCreate(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=150
    )

    code: str | None = Field(
        default=None,
        max_length=30
    )

    description: str | None = Field(
        default=None,
        max_length=500
    )

    department_id: int

    is_active: bool = True


class DirectorateUpdate(BaseModel):

    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150
    )

    code: str | None = Field(
        default=None,
        max_length=30
    )

    description: str | None = Field(
        default=None,
        max_length=500
    )

    department_id: int | None = None

    is_active: bool | None = None


class DirectorateResponse(ORMBaseModel):

    id: int

    name: str

    code: str | None = None

    description: str | None = None

    department_id: int

    department_name: str | None = None

    is_active: bool

    unit_count: int = 0

    personnel_count: int = 0

    created_at: datetime | None = None

    updated_at: datetime | None = None


# ==================================================
# ORGANİZASYON BİRİMİ
# ==================================================


class OrganizationUnitCreate(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=150
    )

    code: str | None = Field(
        default=None,
        max_length=30
    )

    description: str | None = Field(
        default=None,
        max_length=500
    )

    directorate_id: int

    is_active: bool = True


class OrganizationUnitUpdate(BaseModel):

    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150
    )

    code: str | None = Field(
        default=None,
        max_length=30
    )

    description: str | None = Field(
        default=None,
        max_length=500
    )

    directorate_id: int | None = None

    is_active: bool | None = None


class OrganizationUnitResponse(ORMBaseModel):

    id: int

    name: str

    code: str | None = None

    description: str | None = None

    directorate_id: int

    directorate_name: str | None = None

    department_id: int | None = None

    department_name: str | None = None

    is_active: bool

    personnel_count: int = 0

    created_at: datetime | None = None

    updated_at: datetime | None = None


# ==================================================
# DİNAMİK UNVAN
# ==================================================


class JobTitleCreate(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=100
    )

    code: str | None = Field(
        default=None,
        max_length=30
    )

    description: str | None = Field(
        default=None,
        max_length=500
    )

    level: int = Field(
        default=1,
        ge=1,
        le=100
    )

    is_manager: bool = False

    is_active: bool = True


class JobTitleUpdate(BaseModel):

    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    code: str | None = Field(
        default=None,
        max_length=30
    )

    description: str | None = Field(
        default=None,
        max_length=500
    )

    level: int | None = Field(
        default=None,
        ge=1,
        le=100
    )

    is_manager: bool | None = None

    is_active: bool | None = None


class JobTitleResponse(ORMBaseModel):

    id: int

    name: str

    code: str | None = None

    description: str | None = None

    level: int

    is_manager: bool

    is_active: bool

    personnel_count: int = 0

    created_at: datetime | None = None

    updated_at: datetime | None = None


# ==================================================
# KURUM AĞACI
# ==================================================


class OrganizationUnitTreeItem(
    OrganizationUnitResponse
):

    pass


class DirectorateTreeItem(
    DirectorateResponse
):

    units: list[
        OrganizationUnitTreeItem
    ] = []


class DepartmentTreeItem(
    DepartmentResponse
):

    directorates: list[
        DirectorateTreeItem
    ] = []


# ==================================================
# SİSTEM LOG
# ==================================================


class SystemLogResponse(ORMBaseModel):

    id: int

    user_id: int | None = None

    action: str

    description: str | None = None

    created_at: datetime

    user_name: str | None = None

# ==================================================
# ESKİ TEAMS ROUTER İLE GERİYE DÖNÜK UYUMLULUK
# ==================================================


class TeamMemberAssign(BaseModel):
    """Bir veya birden fazla personeli ekibe atamak için kullanılır."""

    user_id: int | None = None
    user_ids: list[int] = []

    @model_validator(mode="after")
    def validate_users(self):
        if self.user_id is None and not self.user_ids:
            raise ValueError("En az bir user_id veya user_ids gönderilmelidir.")

        if self.user_id is not None and self.user_id not in self.user_ids:
            self.user_ids = [self.user_id, *self.user_ids]

        self.user_ids = list(dict.fromkeys(self.user_ids))
        return self


class TeamLeaderAssign(BaseModel):
    """Ekibe lider atamak veya lideri kaldırmak için kullanılır."""

    leader_id: int | None = None


class TeamMemberRemove(BaseModel):
    """Eski router sürümlerinde body üzerinden personel kaldırma desteği."""

    user_id: int


class TeamLeaderResponse(BaseModel):
    message: str
    team_id: int | None = None
    leader_id: int | None = None


class TeamMemberActionResponse(BaseModel):
    message: str
    team_id: int | None = None
    user_id: int | None = None
    user_ids: list[int] = []

# ==================================================
# ESKİ ROUTER'LAR İÇİN TAM UYUMLULUK ŞEMALARI
# ==================================================


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
    total_members: int = 0
    working_count: int = 0
    not_working_count: int = 0
    on_leave_count: int = 0
    late_count: int = 0
    members: list[TeamAttendanceMemberResponse] = Field(default_factory=list)


class ShiftDetailResponse(ShiftResponse):
    assignment_count: int = 0


class CurrentShiftResponse(BaseModel):
    assignment_id: int | None = None
    shift_id: int | None = None
    shift_name: str | None = None
    start_time: time | None = None
    end_time: time | None = None
    start_time_text: str | None = None
    end_time_text: str | None = None
    break_minutes: int = 0
    late_tolerance_minutes: int = 0
    early_check_in_minutes: int = 0
    overtime_tolerance_minutes: int = 0
    workplace_id: int | None = None
    workplace_name: str | None = None
    assignment_type: str | None = None
    assigned_name: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_active: bool = True
    is_overnight: bool = False
    notes: str | None = None
