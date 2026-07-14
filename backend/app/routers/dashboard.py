from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import User, Attendance
from ..security import get_current_user

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)
@router.get("/")
def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    today = date.today()

    total_users = db.query(User).count()

    today_check_in = db.query(Attendance).filter(
        func.date(Attendance.check_in_time) == today
    ).count()

    today_check_out = db.query(Attendance).filter(
        func.date(Attendance.check_out_time) == today
    ).count()

    currently_inside = db.query(Attendance).filter(
        Attendance.check_out_time == None
    ).count()

    today_absent = total_users - today_check_in

    return {
        "total_users": total_users,
        "today_check_in": today_check_in,
        "today_check_out": today_check_out,
        "currently_inside": currently_inside,
        "today_absent": today_absent
    }