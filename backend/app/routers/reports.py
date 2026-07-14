from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import calendar

from fastapi.responses import StreamingResponse
from io import BytesIO
from openpyxl import Workbook

from ..database import get_db
from ..models import Attendance, User, Leave
from ..security import admin_required


router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)



# =========================
# AYLIK RAPOR
# =========================

@router.get("/monthly/{user_id}")
def monthly_report(
    user_id: int,
    year: int,
    month: int,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()


    if not user:
        raise HTTPException(
            status_code=404,
            detail="Personel bulunamadı"
        )


    start_date = datetime(
        year,
        month,
        1
    )


    last_day = calendar.monthrange(
        year,
        month
    )[1]


    end_date = datetime(
        year,
        month,
        last_day,
        23,
        59,
        59
    )


    attendances = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        Attendance.check_in_time >= start_date,
        Attendance.check_in_time <= end_date
    ).all()



    total_seconds = 0

    late_count = 0

    late_minutes = 0



    for record in attendances:

        if record.check_out_time:

            total_seconds += (
                record.check_out_time -
                record.check_in_time
            ).total_seconds()



        if record.late:

            late_count += 1

            late_minutes += record.late_minutes



    hours = int(
        total_seconds // 3600
    )


    minutes = int(
        (total_seconds % 3600) // 60
    )



    leaves = db.query(Leave).filter(
        Leave.user_id == user_id,
        Leave.status == "approved",
        Leave.start_date >= start_date.date(),
        Leave.end_date <= end_date.date()
    ).all()



    leave_days = 0


    for leave in leaves:

        leave_days += (
            leave.end_date -
            leave.start_date
        ).days + 1



    return {

        "personel":
        f"{user.name} {user.surname}",

        "ay":
        f"{year}-{month:02}",

        "calisma_gunu":
        len(attendances),

        "toplam_saat":
        f"{hours} saat {minutes} dakika",

        "gecikme_sayisi":
        late_count,

        "gecikme_dakika":
        late_minutes,

        "izin_gunu":
        leave_days

    }





# =========================
# EXCEL RAPOR
# =========================

@router.get("/monthly/excel/{user_id}")
def monthly_excel_report(
    user_id: int,
    year: int,
    month: int,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()


    if not user:
        raise HTTPException(
            status_code=404,
            detail="Personel bulunamadı"
        )



    start_date = datetime(
        year,
        month,
        1
    )


    last_day = calendar.monthrange(
        year,
        month
    )[1]


    end_date = datetime(
        year,
        month,
        last_day,
        23,
        59,
        59
    )



    records = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        Attendance.check_in_time >= start_date,
        Attendance.check_in_time <= end_date
    ).all()



    wb = Workbook()

    ws = wb.active

    ws.title = "Aylık Rapor"



    ws.append([
        "Personel",
        "Giriş",
        "Çıkış",
        "Çalışma Süresi",
        "Geç Mi?",
        "Geç Dakika"
    ])




    for record in records:


        duration = ""


        if record.check_out_time:

            seconds = (
                record.check_out_time -
                record.check_in_time
            ).total_seconds()


            hours = int(
                seconds // 3600
            )


            minutes = int(
                (seconds % 3600) // 60
            )


            duration = (
                f"{hours} saat "
                f"{minutes} dakika"
            )



        ws.append([

            f"{user.name} {user.surname}",

            record.check_in_time,

            record.check_out_time,

            duration,

            "Evet" if record.late else "Hayır",

            record.late_minutes

        ])




    file = BytesIO()

    wb.save(file)

    file.seek(0)



    return StreamingResponse(

        file,

        media_type=
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        headers={

            "Content-Disposition":
            f"attachment; filename={user.name}_rapor.xlsx"

        }

    )