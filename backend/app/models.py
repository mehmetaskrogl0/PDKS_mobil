from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Date,
    DateTime,
    ForeignKey,
    Boolean,
    Time,
    Text,
    UniqueConstraint
)

from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from .database import Base


# =========================
# USER MODEL
# =========================

class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(50),
        nullable=False
    )

    surname = Column(
        String(50),
        nullable=False
    )

    email = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    password = Column(
        String(255),
        nullable=False
    )

    role = Column(
        String(20),
        default="personnel",
        nullable=False
    )

    workplace_id = Column(
        Integer,
        ForeignKey(
            "workplaces.id",
            ondelete="SET NULL"
        ),
        nullable=True
    )

    team_id = Column(
        Integer,
        ForeignKey(
            "teams.id",
            ondelete="SET NULL"
        ),
        nullable=True
    )

    job_title = Column(
        String(100),
        nullable=True
    )

    job_description = Column(
        String(500),
        nullable=True
    )

    department_id = Column(
        Integer,
        ForeignKey(
            "departments.id",
            ondelete="SET NULL"
        ),
        nullable=True,
        index=True
    )

    directorate_id = Column(
        Integer,
        ForeignKey(
            "directorates.id",
            ondelete="SET NULL"
        ),
        nullable=True,
        index=True
    )

    organization_unit_id = Column(
        Integer,
        ForeignKey(
            "organization_units.id",
            ondelete="SET NULL"
        ),
        nullable=True,
        index=True
    )

    job_title_id = Column(
        Integer,
        ForeignKey(
            "job_titles.id",
            ondelete="SET NULL"
        ),
        nullable=True,
        index=True
    )

    workplace = relationship(
        "Workplace",
        back_populates="users"
    )

    department = relationship(
        "Department",
        back_populates="users",
        foreign_keys=[department_id]
    )

    directorate = relationship(
        "Directorate",
        back_populates="users",
        foreign_keys=[directorate_id]
    )

    organization_unit = relationship(
        "OrganizationUnit",
        back_populates="users",
        foreign_keys=[organization_unit_id]
    )

    job_title_record = relationship(
        "JobTitle",
        back_populates="users",
        foreign_keys=[job_title_id]
    )

    team = relationship(
        "Team",
        back_populates="members",
        foreign_keys=[team_id]
    )

    led_teams = relationship(
        "Team",
        back_populates="leader",
        foreign_keys="Team.leader_id"
    )

    attendances = relationship(
        "Attendance",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    leaves = relationship(
        "Leave",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    system_logs = relationship(
        "SystemLog",
        back_populates="user"
    )

    shift_assignments = relationship(
        "ShiftAssignment",
        back_populates="user",
        foreign_keys="ShiftAssignment.user_id",
        cascade="all, delete-orphan"
    )

    @property
    def full_name(self):

        return f"{self.name} {self.surname}"

    @property
    def workplace_name(self):

        if self.workplace:

            return self.workplace.name

        return None

    @property
    def team_name(self):

        if self.team:

            return self.team.name

        return None

    @property
    def is_team_leader(self):

        return len(self.led_teams) > 0


    @property
    def department_name(self):

        if self.department:
            return self.department.name

        return None

    @property
    def directorate_name(self):

        if self.directorate:
            return self.directorate.name

        return None

    @property
    def organization_unit_name(self):

        if self.organization_unit:
            return self.organization_unit.name

        return None

    @property
    def job_title_name(self):

        if self.job_title_record:
            return self.job_title_record.name

        return self.job_title


# =========================
# DEPARTMENT MODEL
# =========================

class Department(Base):

    __tablename__ = "departments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(150),
        unique=True,
        index=True,
        nullable=False
    )

    code = Column(
        String(50),
        unique=True,
        index=True,
        nullable=True
    )

    description = Column(
        Text,
        nullable=True
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    directorates = relationship(
        "Directorate",
        back_populates="department"
    )

    users = relationship(
        "User",
        back_populates="department",
        foreign_keys="User.department_id"
    )


# =========================
# DIRECTORATE MODEL
# =========================

class Directorate(Base):

    __tablename__ = "directorates"

    __table_args__ = (
        UniqueConstraint(
            "department_id",
            "name",
            name="uq_directorate_department_name"
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(150),
        index=True,
        nullable=False
    )

    code = Column(
        String(50),
        unique=True,
        index=True,
        nullable=True
    )

    description = Column(
        Text,
        nullable=True
    )

    department_id = Column(
        Integer,
        ForeignKey(
            "departments.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    department = relationship(
        "Department",
        back_populates="directorates"
    )

    units = relationship(
        "OrganizationUnit",
        back_populates="directorate"
    )

    users = relationship(
        "User",
        back_populates="directorate",
        foreign_keys="User.directorate_id"
    )


# =========================
# ORGANIZATION UNIT MODEL
# =========================

class OrganizationUnit(Base):

    __tablename__ = "organization_units"

    __table_args__ = (
        UniqueConstraint(
            "directorate_id",
            "name",
            name="uq_unit_directorate_name"
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(150),
        index=True,
        nullable=False
    )

    code = Column(
        String(50),
        unique=True,
        index=True,
        nullable=True
    )

    description = Column(
        Text,
        nullable=True
    )

    directorate_id = Column(
        Integer,
        ForeignKey(
            "directorates.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    directorate = relationship(
        "Directorate",
        back_populates="units"
    )

    users = relationship(
        "User",
        back_populates="organization_unit",
        foreign_keys="User.organization_unit_id"
    )


# =========================
# JOB TITLE MODEL
# =========================

class JobTitle(Base):

    __tablename__ = "job_titles"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(150),
        unique=True,
        index=True,
        nullable=False
    )

    code = Column(
        String(50),
        unique=True,
        index=True,
        nullable=True
    )

    description = Column(
        Text,
        nullable=True
    )

    level = Column(
        Integer,
        default=1,
        nullable=False
    )

    is_manager = Column(
        Boolean,
        default=False,
        nullable=False
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    users = relationship(
        "User",
        back_populates="job_title_record",
        foreign_keys="User.job_title_id"
    )


# =========================
# TEAM MODEL
# =========================

class Team(Base):

    __tablename__ = "teams"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    description = Column(
        String(500),
        nullable=True
    )

    leader_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="SET NULL"
        ),
        nullable=True
    )

    workplace_id = Column(
        Integer,
        ForeignKey(
            "workplaces.id",
            ondelete="SET NULL"
        ),
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    leader = relationship(
        "User",
        back_populates="led_teams",
        foreign_keys=[leader_id]
    )

    members = relationship(
        "User",
        back_populates="team",
        foreign_keys="User.team_id"
    )

    workplace = relationship(
        "Workplace",
        back_populates="teams"
    )

    shift_assignments = relationship(
        "ShiftAssignment",
        back_populates="team",
        foreign_keys="ShiftAssignment.team_id",
        cascade="all, delete-orphan"
    )

    @property
    def leader_name(self):

        if self.leader:

            return self.leader.full_name

        return None

    @property
    def member_count(self):

        return len(self.members)


# =========================
# WORKPLACE MODEL
# =========================

class Workplace(Base):

    __tablename__ = "workplaces"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(100),
        nullable=False
    )

    latitude = Column(
        Float,
        nullable=False
    )

    longitude = Column(
        Float,
        nullable=False
    )

    radius = Column(
        Integer,
        nullable=False
    )

    start_time = Column(
        String(5),
        default="09:00"
    )

    users = relationship(
        "User",
        back_populates="workplace"
    )

    teams = relationship(
        "Team",
        back_populates="workplace"
    )

    shifts = relationship(
        "Shift",
        back_populates="workplace"
    )


# =========================
# ATTENDANCE MODEL
# =========================

class Attendance(Base):

    __tablename__ = "attendance"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    check_in_time = Column(
        DateTime,
        default=func.now(),
        nullable=False
    )

    check_out_time = Column(
        DateTime,
        nullable=True
    )

    check_in_lat = Column(
        Float,
        nullable=False
    )

    check_in_long = Column(
        Float,
        nullable=False
    )

    check_out_lat = Column(
        Float,
        nullable=True
    )

    check_out_long = Column(
        Float,
        nullable=True
    )

    late = Column(
        Boolean,
        default=False
    )

    late_minutes = Column(
        Integer,
        default=0
    )

    overtime_minutes = Column(
        Integer,
        default=0
    )

    missing_minutes = Column(
        Integer,
        default=0
    )

    user = relationship(
        "User",
        back_populates="attendances"
    )


# =========================
# LEAVE MODEL
# =========================

class Leave(Base):

    __tablename__ = "leaves"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    start_date = Column(
        Date,
        nullable=False
    )

    end_date = Column(
        Date,
        nullable=False
    )

    reason = Column(
        String(255),
        nullable=False
    )

    status = Column(
        String(50),
        default="pending",
        nullable=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    user = relationship(
        "User",
        back_populates="leaves"
    )


# =========================
# SHIFT MODEL
# =========================

class Shift(Base):

    __tablename__ = "shifts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    description = Column(
        String(500),
        nullable=True
    )

    start_time = Column(
        Time,
        nullable=False
    )

    end_time = Column(
        Time,
        nullable=False
    )

    break_minutes = Column(
        Integer,
        default=0,
        nullable=False
    )

    late_tolerance_minutes = Column(
        Integer,
        default=0,
        nullable=False
    )

    early_check_in_minutes = Column(
        Integer,
        default=30,
        nullable=False
    )

    overtime_tolerance_minutes = Column(
        Integer,
        default=0,
        nullable=False
    )

    workplace_id = Column(
        Integer,
        ForeignKey(
            "workplaces.id",
            ondelete="SET NULL"
        ),
        nullable=True
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    workplace = relationship(
        "Workplace",
        back_populates="shifts"
    )

    assignments = relationship(
        "ShiftAssignment",
        back_populates="shift",
        cascade="all, delete-orphan"
    )

    @property
    def is_overnight(self):

        return self.end_time <= self.start_time

    @property
    def start_time_text(self):

        if not self.start_time:

            return None

        return self.start_time.strftime(
            "%H:%M"
        )

    @property
    def end_time_text(self):

        if not self.end_time:

            return None

        return self.end_time.strftime(
            "%H:%M"
        )


# =========================
# SHIFT ASSIGNMENT MODEL
# =========================

class ShiftAssignment(Base):

    __tablename__ = "shift_assignments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    shift_id = Column(
        Integer,
        ForeignKey(
            "shifts.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=True
    )

    team_id = Column(
        Integer,
        ForeignKey(
            "teams.id",
            ondelete="CASCADE"
        ),
        nullable=True
    )

    start_date = Column(
        Date,
        nullable=False
    )

    end_date = Column(
        Date,
        nullable=True
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    notes = Column(
        String(500),
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    shift = relationship(
        "Shift",
        back_populates="assignments"
    )

    user = relationship(
        "User",
        back_populates="shift_assignments",
        foreign_keys=[user_id]
    )

    team = relationship(
        "Team",
        back_populates="shift_assignments",
        foreign_keys=[team_id]
    )

    @property
    def assignment_type(self):

        if self.user_id:

            return "user"

        if self.team_id:

            return "team"

        return None

    @property
    def assigned_name(self):

        if self.user:

            return self.user.full_name

        if self.team:

            return self.team.name

        return None


# =========================
# SYSTEM LOG MODEL
# =========================

class SystemLog(Base):

    __tablename__ = "system_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="SET NULL"
        ),
        nullable=True
    )

    action = Column(
        String(100),
        nullable=False
    )

    description = Column(
        String(255),
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    user = relationship(
        "User",
        back_populates="system_logs"
    )