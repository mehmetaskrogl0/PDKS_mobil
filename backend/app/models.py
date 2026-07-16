from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Date,
    DateTime,
    ForeignKey,
    Boolean
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

    workplace = relationship(
        "Workplace",
        back_populates="users"
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