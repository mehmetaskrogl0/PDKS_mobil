from datetime import time, timedelta, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import User, Attendance, Workplace, Leave, Team
from ..security import get_current_user, admin_required


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


TURKEY_TIMEZONE = timezone(timedelta(hours=3))


# =========================
# TARİH YARDIMCI FONKSİYONLARI
# =========================

def get_turkey_day_utc_range(selected_date=None):

    if selected_date is None:
        selected_date = datetime.now(
            TURKEY_TIMEZONE
        ).date()

    local_start = datetime.combine(
        selected_date,
        time.min,
        tzinfo=TURKEY_TIMEZONE
    )

    local_end = local_start + timedelta(days=1)

    utc_start = local_start.astimezone(
        timezone.utc
    ).replace(tzinfo=None)

    utc_end = local_end.astimezone(
        timezone.utc
    ).replace(tzinfo=None)

    return utc_start, utc_end


def get_current_datetime_for(attendance_datetime):

    if (
        attendance_datetime is not None
        and attendance_datetime.tzinfo is not None
    ):
        return datetime.now(timezone.utc)

    return datetime.now(
        timezone.utc
    ).replace(tzinfo=None)


# =========================
# PERSONEL DASHBOARD
# =========================

@router.get("/")
def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    today_start, today_end = get_turkey_day_utc_range()

    attendance = (
        db.query(Attendance)
        .filter(
            Attendance.user_id == current_user.id,
            Attendance.check_in_time >= today_start,
            Attendance.check_in_time < today_end
        )
        .order_by(
            Attendance.check_in_time.desc()
        )
        .first()
    )

    approved_leave_count = (
        db.query(Leave)
        .filter(
            Leave.user_id == current_user.id,
            Leave.status == "approved"
        )
        .count()
    )

    full_name = (
        f"{current_user.name} "
        f"{current_user.surname}"
    )

    response = {
        "user": full_name,
        "role": current_user.role,
        "workplace_name": current_user.workplace_name,
        "team_name": current_user.team_name,
        "status": "Bugün giriş yapılmamış",
        "check_in": None,
        "check_out": None,
        "work_duration": "0 saat 0 dakika",
        "late": False,
        "late_minutes": 0,
        "overtime_minutes": 0,
        "missing_minutes": 0,
        "approved_leave_count": approved_leave_count
    }

    if not attendance:
        return response

    if attendance.check_out_time:

        status = "Mesai tamamlandı"

        duration = (
            attendance.check_out_time
            - attendance.check_in_time
        )

    else:

        status = "Çalışıyor"

        current_time = get_current_datetime_for(
            attendance.check_in_time
        )

        duration = (
            current_time
            - attendance.check_in_time
        )

    total_seconds = max(
        0,
        duration.total_seconds()
    )

    hours = int(total_seconds // 3600)

    minutes = int(
        (total_seconds % 3600) // 60
    )

    response.update({
        "status": status,
        "check_in": attendance.check_in_time,
        "check_out": attendance.check_out_time,
        "work_duration": (
            f"{hours} saat {minutes} dakika"
        ),
        "late": attendance.late or False,
        "late_minutes": (
            attendance.late_minutes or 0
        ),
        "overtime_minutes": (
            attendance.overtime_minutes or 0
        ),
        "missing_minutes": (
            attendance.missing_minutes or 0
        )
    })

    return response


# =========================
# ADMIN DASHBOARD
# =========================

@router.get("/admin")
def admin_dashboard(
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):

    today_start, today_end = get_turkey_day_utc_range()

    # Sistemde bazı yerlerde employee,
    # bazı yerlerde personnel kullanılmış olabilir.
    personnel_roles = [
        "employee",
        "personnel"
    ]

    total_users = (
        db.query(User)
        .filter(
            User.role.in_(personnel_roles)
        )
        .count()
    )

    total_workplaces = (
        db.query(Workplace)
        .count()
    )

    total_teams = (
        db.query(Team)
        .count()
    )

    today_checkins = (
        db.query(
            func.count(
                func.distinct(
                    Attendance.user_id
                )
            )
        )
        .filter(
            Attendance.check_in_time >= today_start,
            Attendance.check_in_time < today_end
        )
        .scalar()
        or 0
    )

    today_checkouts = (
        db.query(
            func.count(
                func.distinct(
                    Attendance.user_id
                )
            )
        )
        .filter(
            Attendance.check_out_time >= today_start,
            Attendance.check_out_time < today_end
        )
        .scalar()
        or 0
    )

    active_employees = (
        db.query(
            func.count(
                func.distinct(
                    Attendance.user_id
                )
            )
        )
        .filter(
            Attendance.check_out_time.is_(None),
            Attendance.check_in_time >= today_start,
            Attendance.check_in_time < today_end
        )
        .scalar()
        or 0
    )

    late_today = (
        db.query(
            func.count(
                func.distinct(
                    Attendance.user_id
                )
            )
        )
        .filter(
            Attendance.check_in_time >= today_start,
            Attendance.check_in_time < today_end,
            Attendance.late.is_(True)
        )
        .scalar()
        or 0
    )

    pending_leaves = (
        db.query(Leave)
        .filter(
            Leave.status == "pending"
        )
        .count()
    )

    approved_leaves = (
        db.query(Leave)
        .filter(
            Leave.status == "approved"
        )
        .count()
    )

    rejected_leaves = (
        db.query(Leave)
        .filter(
            Leave.status == "rejected"
        )
        .count()
    )

    today_absent = max(
        0,
        total_users - today_checkins
    )

    # =========================
    # GENEL ÇALIŞMA İSTATİSTİKLERİ
    # =========================

    total_overtime = (
        db.query(
            func.sum(
                Attendance.overtime_minutes
            )
        )
        .scalar()
        or 0
    )

    total_missing = (
        db.query(
            func.sum(
                Attendance.missing_minutes
            )
        )
        .scalar()
        or 0
    )

    total_late_minutes = (
        db.query(
            func.sum(
                Attendance.late_minutes
            )
        )
        .scalar()
        or 0
    )

    # =========================
    # SON GİRİŞLER
    # =========================

    recent_attendance = (
        db.query(
            Attendance,
            User
        )
        .join(
            User,
            Attendance.user_id == User.id
        )
        .order_by(
            Attendance.check_in_time.desc()
        )
        .limit(10)
        .all()
    )

    recent_list = []

    for attendance, user in recent_attendance:

        recent_list.append({
            "user_id": user.id,
            "name": user.full_name,
            "team_name": user.team_name,
            "workplace_name": user.workplace_name,
            "check_in": attendance.check_in_time,
            "check_out": attendance.check_out_time,
            "late": attendance.late or False,
            "late_minutes": (
                attendance.late_minutes or 0
            )
        })

    # =========================
    # AKTİF PERSONELLER
    # =========================

    active_users = (
        db.query(
            Attendance,
            User
        )
        .join(
            User,
            Attendance.user_id == User.id
        )
        .filter(
            Attendance.check_out_time.is_(None),
            Attendance.check_in_time >= today_start,
            Attendance.check_in_time < today_end
        )
        .all()
    )

    active_list = []

    for attendance, user in active_users:

        active_list.append({
            "user_id": user.id,
            "name": user.full_name,
            "team_name": user.team_name,
            "workplace_name": user.workplace_name,
            "check_in": attendance.check_in_time
        })

    # =========================
    # GEÇ KALAN PERSONELLER
    # =========================

    late_users = (
        db.query(
            Attendance,
            User
        )
        .join(
            User,
            Attendance.user_id == User.id
        )
        .filter(
            Attendance.check_in_time >= today_start,
            Attendance.check_in_time < today_end,
            Attendance.late.is_(True)
        )
        .all()
    )

    late_list = []

    for attendance, user in late_users:

        late_list.append({
            "user_id": user.id,
            "name": user.full_name,
            "team_name": user.team_name,
            "late_minutes": (
                attendance.late_minutes or 0
            )
        })

    # =========================
    # İŞ YERİ DURUMU
    # =========================

    workplaces = (
        db.query(Workplace)
        .order_by(
            Workplace.name.asc()
        )
        .all()
    )

    workplace_list = []

    for workplace in workplaces:

        total_employee = (
            db.query(User)
            .filter(
                User.workplace_id == workplace.id,
                User.role.in_(personnel_roles)
            )
            .count()
        )

        active_employee = (
            db.query(
                func.count(
                    func.distinct(
                        Attendance.user_id
                    )
                )
            )
            .join(
                User,
                Attendance.user_id == User.id
            )
            .filter(
                User.workplace_id == workplace.id,
                Attendance.check_out_time.is_(None),
                Attendance.check_in_time >= today_start,
                Attendance.check_in_time < today_end
            )
            .scalar()
            or 0
        )

        today_workplace_checkins = (
            db.query(
                func.count(
                    func.distinct(
                        Attendance.user_id
                    )
                )
            )
            .join(
                User,
                Attendance.user_id == User.id
            )
            .filter(
                User.workplace_id == workplace.id,
                Attendance.check_in_time >= today_start,
                Attendance.check_in_time < today_end
            )
            .scalar()
            or 0
        )

        workplace_list.append({
            "workplace_id": workplace.id,
            "workplace": workplace.name,
            "total_employee": total_employee,
            "active_employee": active_employee,
            "today_checkin_count": (
                today_workplace_checkins
            ),
            "today_absent_count": max(
                0,
                total_employee
                - today_workplace_checkins
            )
        })

    # =========================
    # EKİP İSTATİSTİKLERİ
    # =========================

    teams = (
        db.query(Team)
        .order_by(
            Team.name.asc()
        )
        .all()
    )

    team_list = []

    for team in teams:

        member_count = (
            db.query(User)
            .filter(
                User.team_id == team.id
            )
            .count()
        )

        active_member_count = (
            db.query(
                func.count(
                    func.distinct(
                        Attendance.user_id
                    )
                )
            )
            .join(
                User,
                Attendance.user_id == User.id
            )
            .filter(
                User.team_id == team.id,
                Attendance.check_out_time.is_(None),
                Attendance.check_in_time >= today_start,
                Attendance.check_in_time < today_end
            )
            .scalar()
            or 0
        )

        today_checkin_count = (
            db.query(
                func.count(
                    func.distinct(
                        Attendance.user_id
                    )
                )
            )
            .join(
                User,
                Attendance.user_id == User.id
            )
            .filter(
                User.team_id == team.id,
                Attendance.check_in_time >= today_start,
                Attendance.check_in_time < today_end
            )
            .scalar()
            or 0
        )

        today_late_count = (
            db.query(
                func.count(
                    func.distinct(
                        Attendance.user_id
                    )
                )
            )
            .join(
                User,
                Attendance.user_id == User.id
            )
            .filter(
                User.team_id == team.id,
                Attendance.check_in_time >= today_start,
                Attendance.check_in_time < today_end,
                Attendance.late.is_(True)
            )
            .scalar()
            or 0
        )
        overtime_minutes = (
            db.query(
                func.sum(
                    Attendance.overtime_minutes
                )
            )
            .join(
                User,
                Attendance.user_id == User.id
            )
            .filter(
                User.team_id == team.id
            )
            .scalar()
            or 0
        )

        missing_minutes = (
            db.query(
                func.sum(
                    Attendance.missing_minutes
                )
            )
            .join(
                User,
                Attendance.user_id == User.id
            )
            .filter(
                User.team_id == team.id
            )
            .scalar()
            or 0
        )

        late_minutes = (
            db.query(
                func.sum(
                    Attendance.late_minutes
                )
            )
            .join(
                User,
                Attendance.user_id == User.id
            )
            .filter(
                User.team_id == team.id
            )
            .scalar()
            or 0
        )

        today_overtime_minutes = (
            db.query(
                func.sum(
                    Attendance.overtime_minutes
                )
            )
            .join(
                User,
                Attendance.user_id == User.id
            )
            .filter(
                User.team_id == team.id,
                Attendance.check_in_time >= today_start,
                Attendance.check_in_time < today_end
            )
            .scalar()
            or 0
        )

        today_missing_minutes = (
            db.query(
                func.sum(
                    Attendance.missing_minutes
                )
            )
            .join(
                User,
                Attendance.user_id == User.id
            )
            .filter(
                User.team_id == team.id,
                Attendance.check_in_time >= today_start,
                Attendance.check_in_time < today_end
            )
            .scalar()
            or 0
        )

        today_late_minutes = (
            db.query(
                func.sum(
                    Attendance.late_minutes
                )
            )
            .join(
                User,
                Attendance.user_id == User.id
            )
            .filter(
                User.team_id == team.id,
                Attendance.check_in_time >= today_start,
                Attendance.check_in_time < today_end
            )
            .scalar()
            or 0
        )

        team_list.append({
            "team_id": team.id,
            "team_name": team.name,
            "description": team.description,
            "leader_id": team.leader_id,
            "leader_name": team.leader_name,
            "workplace_id": team.workplace_id,
            "workplace_name": (
                team.workplace.name
                if team.workplace
                else None
            ),
            "member_count": member_count,
            "active_member_count": (
                active_member_count
            ),
            "today_checkin_count": (
                today_checkin_count
            ),
            "today_absent_count": max(
                0,
                member_count - today_checkin_count
            ),
            "today_late_count": today_late_count,
            "overtime_minutes": int(
                overtime_minutes
            ),
            "missing_minutes": int(
                missing_minutes
            ),
            "late_minutes": int(
                late_minutes
            ),
            "today_overtime_minutes": int(
                today_overtime_minutes
            ),
            "today_missing_minutes": int(
                today_missing_minutes
            ),
            "today_late_minutes": int(
                today_late_minutes
            )
        })

    total_team_members = sum(
        team["member_count"]
        for team in team_list
    )

    total_active_team_members = sum(
        team["active_member_count"]
        for team in team_list
    )

    team_with_most_overtime = None

    if team_list:

        team_with_most_overtime = max(
            team_list,
            key=lambda team: (
                team["overtime_minutes"]
            )
        )

    team_with_most_late = None

    if team_list:

        team_with_most_late = max(
            team_list,
            key=lambda team: (
                team["late_minutes"]
            )
        )

    return {
        "total_employees": total_users,
        "total_workplaces": total_workplaces,
        "total_teams": total_teams,
        "today_checkins": int(today_checkins),
        "today_checkouts": int(today_checkouts),
        "active_employees": int(
            active_employees
        ),
        "today_absent": int(today_absent),
        "late_today": int(late_today),
        "pending_leaves": pending_leaves,
        "approved_leaves": approved_leaves,
        "rejected_leaves": rejected_leaves,

        "work_statistics": {
            "total_overtime_minutes": int(
                total_overtime
            ),
            "total_missing_minutes": int(
                total_missing
            ),
            "total_late_minutes": int(
                total_late_minutes
            )
        },

        "recent_attendance": recent_list,
        "active_employee_list": active_list,
        "late_employee_list": late_list,
        "workplace_status": workplace_list,

        "team_statistics": {
            "total_teams": total_teams,
            "total_team_members": (
                total_team_members
            ),
            "total_active_team_members": (
                total_active_team_members
            ),
            "team_with_most_overtime": (
                {
                    "team_id": (
                        team_with_most_overtime[
                            "team_id"
                        ]
                    ),
                    "team_name": (
                        team_with_most_overtime[
                            "team_name"
                        ]
                    ),
                    "overtime_minutes": (
                        team_with_most_overtime[
                            "overtime_minutes"
                        ]
                    )
                }
                if team_with_most_overtime
                else None
            ),
            "team_with_most_late": (
                {
                    "team_id": (
                        team_with_most_late[
                            "team_id"
                        ]
                    ),
                    "team_name": (
                        team_with_most_late[
                            "team_name"
                        ]
                    ),
                    "late_minutes": (
                        team_with_most_late[
                            "late_minutes"
                        ]
                    )
                }
                if team_with_most_late
                else None
            ),
            "teams": team_list
        }
    }


# =========================
# GRAFİK VERİLERİ
# =========================

@router.get("/chart")
def dashboard_chart(
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):

    today = datetime.now(
        TURKEY_TIMEZONE
    ).date()

    start_date = (
        today - timedelta(days=30)
    )

    start_datetime, _ = (
        get_turkey_day_utc_range(
            start_date
        )
    )

    daily_checkins = (
        db.query(
            func.date(
                Attendance.check_in_time
            ).label("day"),
            func.count(
                func.distinct(
                    Attendance.user_id
                )
            ).label("count")
        )
        .filter(
            Attendance.check_in_time
            >= start_datetime
        )
        .group_by(
            func.date(
                Attendance.check_in_time
            )
        )
        .order_by(
            func.date(
                Attendance.check_in_time
            )
        )
        .all()
    )

    checkin_list = []

    for day, count in daily_checkins:

        checkin_list.append({
            "date": str(day),
            "count": int(count)
        })

    monthly_late = (
        db.query(
            func.sum(
                Attendance.late_minutes
            )
        )
        .filter(
            Attendance.check_in_time
            >= start_datetime
        )
        .scalar()
        or 0
    )

    monthly_overtime = (
        db.query(
            func.sum(
                Attendance.overtime_minutes
            )
        )
        .filter(
            Attendance.check_in_time
            >= start_datetime
        )
        .scalar()
        or 0
    )

    monthly_missing = (
        db.query(
            func.sum(
                Attendance.missing_minutes
            )
        )
        .filter(
            Attendance.check_in_time
            >= start_datetime
        )
        .scalar()
        or 0
    )

    # =========================
    # EKİP GRAFİK VERİLERİ
    # =========================

    teams = (
        db.query(Team)
        .order_by(
            Team.name.asc()
        )
        .all()
    )

    team_chart_list = []

    for team in teams:

        member_count = (
            db.query(User)
            .filter(
                User.team_id == team.id
            )
            .count()
        )

        overtime_minutes = (
            db.query(
                func.sum(
                    Attendance.overtime_minutes
                )
            )
            .join(
                User,
                Attendance.user_id == User.id
            )
            .filter(
                User.team_id == team.id,
                Attendance.check_in_time
                >= start_datetime
            )
            .scalar()
            or 0
        )

        missing_minutes = (
            db.query(
                func.sum(
                    Attendance.missing_minutes
                )
            )
            .join(
                User,
                Attendance.user_id == User.id
            )
            .filter(
                User.team_id == team.id,
                Attendance.check_in_time
                >= start_datetime
            )
            .scalar()
            or 0
        )

        late_minutes = (
            db.query(
                func.sum(
                    Attendance.late_minutes
                )
            )
            .join(
                User,
                Attendance.user_id == User.id
            )
            .filter(
                User.team_id == team.id,
                Attendance.check_in_time
                >= start_datetime
            )
            .scalar()
            or 0
        )

        team_chart_list.append({
            "team_id": team.id,
            "team_name": team.name,
            "member_count": member_count,
            "overtime_minutes": int(
                overtime_minutes
            ),
            "missing_minutes": int(
                missing_minutes
            ),
            "late_minutes": int(
                late_minutes
            )
        })

    return {
        "daily_checkins": checkin_list,
        "monthly_late_minutes": int(
            monthly_late
        ),
        "monthly_overtime_minutes": int(
            monthly_overtime
        ),
        "monthly_missing_minutes": int(
            monthly_missing
        ),
        "team_statistics": team_chart_list
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

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="Kullanıcı bulunamadı"
        )

    records = (
        db.query(Attendance)
        .filter(
            Attendance.user_id == user_id
        )
        .order_by(
            Attendance.check_in_time.desc()
        )
        .all()
    )

    total_work_days = len(records)

    total_late_minutes = (
        db.query(
            func.sum(
                Attendance.late_minutes
            )
        )
        .filter(
            Attendance.user_id == user_id
        )
        .scalar()
        or 0
    )

    total_overtime_minutes = (
        db.query(
            func.sum(
                Attendance.overtime_minutes
            )
        )
        .filter(
            Attendance.user_id == user_id
        )
        .scalar()
        or 0
    )

    total_missing_minutes = (
        db.query(
            func.sum(
                Attendance.missing_minutes
            )
        )
        .filter(
            Attendance.user_id == user_id
        )
        .scalar()
        or 0
    )

    approved_leave_count = (
        db.query(Leave)
        .filter(
            Leave.user_id == user_id,
            Leave.status == "approved"
        )
        .count()
    )

    record_list = []

    for record in records[:10]:

        record_list.append({
            "check_in": record.check_in_time,
            "check_out": record.check_out_time,
            "late": record.late or False,
            "late_minutes": (
                record.late_minutes or 0
            ),
            "overtime_minutes": (
                record.overtime_minutes or 0
            ),
            "missing_minutes": (
                record.missing_minutes or 0
            )
        })

    return {
        "user_id": user.id,
        "user": user.full_name,
        "role": user.role,
        "workplace_name": user.workplace_name,
        "team_name": user.team_name,
        "job_title": user.job_title,
        "total_work_days": total_work_days,
        "total_late_minutes": int(
            total_late_minutes
        ),
        "total_overtime_minutes": int(
            total_overtime_minutes
        ),
        "total_missing_minutes": int(
            total_missing_minutes
        ),
        "approved_leave_count": (
            approved_leave_count
        ),
        "records": record_list
    }