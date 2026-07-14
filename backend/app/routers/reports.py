from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import calendar

from fastapi.responses import StreamingResponse
from io import BytesIO
from openpyxl import Workbook

from ..database import get_db
from ..models import Attendance, User, Leave, Workplace
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

    total_overtime = 0

    total_missing = 0



    for record in attendances:


        if record.check_out_time:

            total_seconds += (
                record.check_out_time -
                record.check_in_time
            ).total_seconds()



        if record.late:

            late_count += 1

            late_minutes += record.late_minutes



        total_overtime += record.overtime_minutes

        total_missing += record.missing_minutes




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
        leave_days,

        "fazla_mesai_dakika":
        total_overtime,

        "eksik_mesai_dakika":
        total_missing

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


    records = db.query(
        Attendance
    ).filter(

        Attendance.user_id == user_id,

        Attendance.check_in_time >= start_date,

        Attendance.check_in_time <= end_date

    ).all()



    # =========================
    # ÖZET HESAPLAMA
    # =========================


    total_seconds = 0

    late_count = 0

    late_minutes = 0

    overtime = 0

    missing = 0



    for record in records:


        if record.check_out_time:

            total_seconds += (

                record.check_out_time -

                record.check_in_time

            ).total_seconds()



        if record.late:

            late_count += 1

            late_minutes += record.late_minutes



        overtime += record.overtime_minutes

        missing += record.missing_minutes



    hours = int(
        total_seconds // 3600
    )


    minutes = int(
        (total_seconds % 3600)//60
    )




    # =========================
    # EXCEL OLUŞTUR
    # =========================


    wb = Workbook()


    ws = wb.active


    ws.title = "Aylık Rapor"



    ws.append(
        [
            "PDKS AYLIK PERSONEL RAPORU"
        ]
    )


    ws.append([])


    ws.append(
        [
            "Personel",
            f"{user.name} {user.surname}"
        ]
    )


    ws.append(
        [
            "Dönem",
            f"{year}-{month:02}"
        ]
    )


    ws.append([])


    ws.append(
        [
            "ÖZET"
        ]
    )


    ws.append(
        [
            "Toplam Çalışma",
            f"{hours} saat {minutes} dakika"
        ]
    )


    ws.append(
        [
            "Çalışma Günü",
            len(records)
        ]
    )


    ws.append(
        [
            "Geç Kalma Sayısı",
            late_count
        ]
    )


    ws.append(
        [
            "Geç Kalma Dakika",
            late_minutes
        ]
    )


    ws.append(
        [
            "Fazla Mesai Dakika",
            overtime
        ]
    )


    ws.append(
        [
            "Eksik Mesai Dakika",
            missing
        ]
    )



    ws.append([])


    ws.append(
        [
            "Giriş",
            "Çıkış",
            "Süre",
            "Geç Mi?",
            "Geç Dakika",
            "Fazla Mesai",
            "Eksik Mesai"
        ]
    )



    for record in records:


        duration = ""


        if record.check_out_time:


            seconds = (

                record.check_out_time -

                record.check_in_time

            ).total_seconds()



            h = int(seconds//3600)


            m = int(
                (seconds%3600)//60
            )


            duration = f"{h} saat {m} dakika"




        ws.append(
            [

                record.check_in_time,

                record.check_out_time,

                duration,

                "Evet" if record.late else "Hayır",

                record.late_minutes,

                record.overtime_minutes,

                record.missing_minutes

            ]
        )



    file = BytesIO()


    wb.save(file)


    file.seek(0)



    return StreamingResponse(

        file,

        media_type=
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",


        headers={

            "Content-Disposition":

            f"attachment; filename={user.name}_aylik_rapor.xlsx"

        }

    )


# =========================
# TÜM PERSONEL AYLIK RAPOR
# =========================


@router.get("/monthly/all")
def all_monthly_report(

    year:int,

    month:int,

    db:Session = Depends(get_db),

    admin:User = Depends(admin_required)

):


    users = db.query(User).filter(
        User.role == "employee"
    ).all()



    result = []



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




    for user in users:


        records = db.query(
            Attendance
        ).filter(

            Attendance.user_id == user.id,

            Attendance.check_in_time >= start_date,

            Attendance.check_in_time <= end_date

        ).all()



        total_seconds = 0

        overtime = 0

        missing = 0

        late = 0




        for record in records:


            if record.check_out_time:


                total_seconds += (

                    record.check_out_time

                    -

                    record.check_in_time

                ).total_seconds()



            late += record.late_minutes

            overtime += record.overtime_minutes

            missing += record.missing_minutes





        hours = int(
            total_seconds // 3600
        )



        minutes = int(
            (total_seconds % 3600)//60
        )




        result.append({


            "personel":

                f"{user.name} {user.surname}",



            "calisma_gunu":

                len(records),



            "toplam_saat":

                f"{hours} saat {minutes} dakika",



            "gecikme_dakika":

                late,



            "fazla_mesai":

                overtime,



            "eksik_mesai":

                missing

        })




    return result


# =========================
# İŞYERİ BAZLI AYLIK RAPOR
# =========================


@router.get("/workplace/{workplace_id}")
def workplace_monthly_report(

    workplace_id:int,

    year:int,

    month:int,

    db:Session = Depends(get_db),

    admin:User = Depends(admin_required)

):


    workplace = db.query(Workplace).filter(

        Workplace.id == workplace_id

    ).first()



    if not workplace:

        raise HTTPException(

            status_code=404,

            detail="İşyeri bulunamadı"

        )




    users = db.query(User).filter(

        User.workplace_id == workplace_id,

        User.role == "employee"

    ).all()



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




    result = []



    for user in users:


        records = db.query(

            Attendance

        ).filter(

            Attendance.user_id == user.id,

            Attendance.check_in_time >= start_date,

            Attendance.check_in_time <= end_date

        ).all()



        total_seconds = 0

        overtime = 0

        missing = 0

        late = 0




        for record in records:


            if record.check_out_time:


                total_seconds += (

                    record.check_out_time

                    -

                    record.check_in_time

                ).total_seconds()



            overtime += record.overtime_minutes

            missing += record.missing_minutes

            late += record.late_minutes




        hours = int(

            total_seconds // 3600

        )


        minutes = int(

            (total_seconds % 3600)//60

        )



        result.append({


            "personel":

                f"{user.name} {user.surname}",



            "workplace":

                workplace.name,



            "calisma_gunu":

                len(records),



            "toplam_saat":

                f"{hours} saat {minutes} dakika",



            "gecikme_dakika":

                late,



            "fazla_mesai":

                overtime,



            "eksik_mesai":

                missing

        })




    return result