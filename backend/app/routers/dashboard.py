from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import User, Attendance, Workplace, Leave
from ..security import get_current_user, admin_required


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


# =========================
# PERSONEL DASHBOARD
# =========================

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


# =========================
# ADMIN DASHBOARD
# =========================

@router.get("/admin")
def admin_dashboard(
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):

    today = date.today()

    total_users = db.query(User).count()

    total_workplaces = db.query(Workplace).count()

    today_checkins = db.query(Attendance).filter(
        func.date(Attendance.check_in_time) == today
    ).count()

    active_employees = db.query(Attendance).filter(
        Attendance.check_out_time == None
    ).count()

    late_today = db.query(Attendance).filter(
        func.date(Attendance.check_in_time) == today,
        Attendance.late == True
    ).count()

    pending_leaves = db.query(Leave).filter(
        Leave.status == "pending"
    ).count()

    approved_leaves = db.query(Leave).filter(
        Leave.status == "approved"
    ).count()

    rejected_leaves = db.query(Leave).filter(
        Leave.status == "rejected"
    ).count()

    return {
        "total_users": total_users,
        "total_workplaces": total_workplaces,
        "today_checkins": today_checkins,
        "active_employees": active_employees,
        "late_today": late_today,
        "pending_leaves": pending_leaves,
        "approved_leaves": approved_leaves,
        "rejected_leaves": rejected_leaves
    }