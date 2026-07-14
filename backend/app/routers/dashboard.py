from datetime import date, timedelta

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


    attendance = db.query(Attendance).filter(
        Attendance.user_id == current_user.id,
        func.date(Attendance.check_in_time) == today
    ).first()


    approved_leave = db.query(Leave).filter(
        Leave.user_id == current_user.id,
        Leave.status == "approved"
    ).count()



    if attendance:

        status = (
            "Mesai tamamlandı"
            if attendance.check_out_time
            else "Çalışıyor"
        )


        return {

            "user":
                current_user.name + " " + current_user.surname,

            "status":
                status,

            "check_in":
                attendance.check_in_time,

            "check_out":
                attendance.check_out_time,

            "late":
                attendance.late,

            "late_minutes":
                attendance.late_minutes,

            "overtime_minutes":
                attendance.overtime_minutes,

            "missing_minutes":
                attendance.missing_minutes,

            "approved_leave_count":
                approved_leave
        }



    return {

        "user":
            current_user.name + " " + current_user.surname,

        "status":
            "Bugün giriş yapılmamış",

        "approved_leave_count":
            approved_leave
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



    total_users = db.query(User).filter(
        User.role == "employee"
    ).count()



    total_workplaces = db.query(Workplace).count()



    today_checkins = db.query(Attendance).filter(
        func.date(Attendance.check_in_time) == today
    ).count()



    today_checkouts = db.query(Attendance).filter(
        func.date(Attendance.check_out_time) == today
    ).count()



    active_employees = db.query(Attendance).filter(
        Attendance.check_out_time == None,
        func.date(Attendance.check_in_time) == today
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



    today_absent = total_users - today_checkins





    # =========================
    # ÇALIŞMA İSTATİSTİKLERİ
    # =========================


    total_overtime = db.query(
        func.sum(Attendance.overtime_minutes)
    ).scalar() or 0



    total_missing = db.query(
        func.sum(Attendance.missing_minutes)
    ).scalar() or 0



    total_late_minutes = db.query(
        func.sum(Attendance.late_minutes)
    ).scalar() or 0





    # =========================
    # SON GİRİŞLER
    # =========================


    recent_attendance = db.query(
        Attendance,
        User
    ).join(
        User,
        Attendance.user_id == User.id
    ).order_by(
        Attendance.check_in_time.desc()
    ).limit(10).all()



    recent_list = []


    for attendance, user in recent_attendance:

        recent_list.append({

            "name":
                user.name + " " + user.surname,

            "check_in":
                attendance.check_in_time,

            "check_out":
                attendance.check_out_time,

            "late":
                attendance.late,

            "late_minutes":
                attendance.late_minutes

        })





    # =========================
    # AKTİF PERSONELLER
    # =========================


    active_users = db.query(
        Attendance,
        User
    ).join(
        User,
        Attendance.user_id == User.id
    ).filter(
        Attendance.check_out_time == None,
        func.date(Attendance.check_in_time) == today
    ).all()



    active_list = []


    for attendance, user in active_users:

        active_list.append({

            "name":
                user.name + " " + user.surname,

            "check_in":
                attendance.check_in_time

        })





    # =========================
    # GEÇ KALANLAR
    # =========================


    late_users = db.query(
        Attendance,
        User
    ).join(
        User,
        Attendance.user_id == User.id
    ).filter(
        func.date(Attendance.check_in_time) == today,
        Attendance.late == True
    ).all()



    late_list = []


    for attendance, user in late_users:

        late_list.append({

            "name":
                user.name + " " + user.surname,

            "late_minutes":
                attendance.late_minutes

        })





    # =========================
    # WORKPLACE DURUMU
    # =========================


    workplaces = db.query(Workplace).all()


    workplace_list = []


    for workplace in workplaces:


        total_employee = db.query(User).filter(
            User.workplace_id == workplace.id,
            User.role == "employee"
        ).count()



        active_employee = db.query(Attendance).join(
            User,
            Attendance.user_id == User.id
        ).filter(
            User.workplace_id == workplace.id,
            Attendance.check_out_time == None,
            func.date(Attendance.check_in_time) == today
        ).count()



        workplace_list.append({

            "workplace":
                workplace.name,

            "total_employee":
                total_employee,

            "active_employee":
                active_employee

        })





    return {

        "total_employees": total_users,

        "total_workplaces": total_workplaces,

        "today_checkins": today_checkins,

        "today_checkouts": today_checkouts,

        "active_employees": active_employees,

        "today_absent": today_absent,

        "late_today": late_today,

        "pending_leaves": pending_leaves,

        "approved_leaves": approved_leaves,

        "rejected_leaves": rejected_leaves,


        "work_statistics": {

            "total_overtime_minutes": total_overtime,

            "total_missing_minutes": total_missing,

            "total_late_minutes": total_late_minutes

        },


        "recent_attendance": recent_list,

        "active_employee_list": active_list,

        "late_employee_list": late_list,

        "workplace_status": workplace_list

    }





# =========================
# GRAFİK VERİLERİ
# =========================

@router.get("/chart")
def dashboard_chart(
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):

    today = date.today()

    start_date = today - timedelta(days=30)



    daily_checkins = db.query(
        func.date(Attendance.check_in_time),
        func.count(Attendance.id)
    ).filter(
        Attendance.check_in_time >= start_date
    ).group_by(
        func.date(Attendance.check_in_time)
    ).all()



    checkin_list = []


    for day, count in daily_checkins:

        checkin_list.append({

            "date": str(day),

            "count": count

        })



    monthly_late = db.query(
        func.sum(Attendance.late_minutes)
    ).filter(
        Attendance.check_in_time >= start_date
    ).scalar() or 0



    monthly_overtime = db.query(
        func.sum(Attendance.overtime_minutes)
    ).filter(
        Attendance.check_in_time >= start_date
    ).scalar() or 0



    return {

        "daily_checkins": checkin_list,

        "monthly_late_minutes": monthly_late,

        "monthly_overtime_minutes": monthly_overtime

    }

# =========================
# PERSONEL DETAY DASHBOARD
# =========================

@router.get("/user/{user_id}")
def user_dashboard(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):


    user = db.query(User).filter(
        User.id == user_id
    ).first()



    if not user:
        return {
            "error": "Kullanıcı bulunamadı"
        }




    # Çalışma kayıtları

    records = db.query(
        Attendance
    ).filter(
        Attendance.user_id == user_id
    ).order_by(
        Attendance.check_in_time.desc()
    ).all()





    total_work_days = len(records)



    total_late_minutes = db.query(
        func.sum(Attendance.late_minutes)
    ).filter(
        Attendance.user_id == user_id
    ).scalar() or 0



    total_overtime_minutes = db.query(
        func.sum(Attendance.overtime_minutes)
    ).filter(
        Attendance.user_id == user_id
    ).scalar() or 0



    total_missing_minutes = db.query(
        func.sum(Attendance.missing_minutes)
    ).filter(
        Attendance.user_id == user_id
    ).scalar() or 0





    approved_leave_count = db.query(
        Leave
    ).filter(
        Leave.user_id == user_id,
        Leave.status == "approved"
    ).count()





    record_list = []



    for record in records[:10]:

        record_list.append({

            "check_in":
                record.check_in_time,

            "check_out":
                record.check_out_time,

            "late":
                record.late,

            "late_minutes":
                record.late_minutes,

            "overtime_minutes":
                record.overtime_minutes,

            "missing_minutes":
                record.missing_minutes

        })





    return {


        "user":
            user.name + " " + user.surname,


        "total_work_days":
            total_work_days,


        "total_late_minutes":
            total_late_minutes,


        "total_overtime_minutes":
            total_overtime_minutes,


        "total_missing_minutes":
            total_missing_minutes,


        "approved_leave_count":
            approved_leave_count,


        "records":
            record_list

    }