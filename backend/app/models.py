from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from .database import Base


class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(50))

    surname = Column(String(50))

    email = Column(String(100), unique=True)

    password = Column(String(255))

    role = Column(String(20))

    workplace_id = Column(
        Integer,
        ForeignKey("workplaces.id"),
        nullable=True
    )


class Workplace(Base):

    __tablename__ = "workplaces"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(100))

    latitude = Column(Float)

    longitude = Column(Float)

    radius = Column(Integer)



class Attendance(Base):

    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    check_in_time = Column(DateTime, default=func.now())

    check_out_time = Column(DateTime, nullable=True)

    check_in_lat = Column(Float)

    check_in_long = Column(Float)

    check_out_lat = Column(Float, nullable=True)

    check_out_long = Column(Float, nullable=True)

