from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func

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
        String(50)
    )

    surname = Column(
        String(50)
    )

    email = Column(
        String(100),
        unique=True
    )

    password = Column(
        String(255)
    )

    role = Column(
        String(20)
    )

    workplace_id = Column(
        Integer,
        ForeignKey("workplaces.id"),
        nullable=True
    )



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
        String(100)
    )

    latitude = Column(
        Float
    )

    longitude = Column(
        Float
    )

    radius = Column(
        Integer
    )


    # Mesai başlangıç saati
    # Örnek: 09:00

    start_time = Column(
        String(5),
        default="09:00"
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
        ForeignKey("users.id")
    )


    # Giriş

    check_in_time = Column(
        DateTime,
        default=func.now()
    )


    # Çıkış

    check_out_time = Column(
        DateTime,
        nullable=True
    )


    # Giriş konumu

    check_in_lat = Column(
        Float
    )

    check_in_long = Column(
        Float
    )


    # Çıkış konumu

    check_out_lat = Column(
        Float,
        nullable=True
    )

    check_out_long = Column(
        Float,
        nullable=True
    )



    # =====================
    # MESAI DURUMU
    # =====================


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
        ForeignKey("users.id"),
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
        default="pending"
    )


    created_at = Column(
        DateTime,
        server_default=func.now()
    )



    # =========================
# SYSTEM LOG
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
        ForeignKey("users.id"),
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
        server_default=func.now()
    )