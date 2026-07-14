from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from math import radians, sin, cos, sqrt, atan2
from datetime import datetime

from ..database import get_db
from ..models import Attendance, Workplace, User
from ..schemas import AttendanceCreate
from ..security import get_current_user, admin_required


router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"]
)


def calculate_distance(
    lat1,
    lon1,
    lat2,
    lon2
):

    R = 6371000

    lat1 = radians(lat1)
    lon1 = radians(lon1)
    lat2 = radians(lat2)
    lon2 = radians(lon2)


    dlat = lat2 - lat1
    dlon = lon2 - lon1


    a = (
        sin(dlat / 2) ** 2
        +
        cos(lat1)
        *
        cos(lat2)
        *
        sin(dlon / 2) ** 2
    )


    c = 2 * atan2(
        sqrt(a),
        sqrt(1 - a)
    )


    return R * c



# =========================
# CHECK-IN
# =========================

@router.post("/check-in")
def check_in(
    data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Kullanıcının aktif mesaisi var mı kontrol et
    active_attendance = db.query(Attendance).filter(
        Attendance.user_id == current_user.id,
        Attendance.check_out_time == None
    ).first()


    if active_attendance:
        raise HTTPException(
            status_code=400,
            detail="Zaten aktif bir mesai kaydınız var. Önce çıkış yapmalısınız."
        )


    # Kullanıcının bağlı olduğu iş yerini bul
    workplace = db.query(Workplace).filter(
        Workplace.id == current_user.workplace_id
    ).first()


    if not workplace:
        raise HTTPException(
            status_code=404,
            detail="Kullanıcıya atanmış iş yeri bulunamadı"
        )


    # Mesafe hesaplama
    distance = calculate_distance(
        data.latitude,
        data.longitude,
        workplace.latitude,
        workplace.longitude
    )


    # Yarıçap kontrolü
    if distance > workplace.radius:
        raise HTTPException(
            status_code=400,
            detail=f"İşyeri dışında. Mesafe: {int(distance)} metre"
        )


    # Attendance kaydı oluştur
    attendance = Attendance(
        user_id=current_user.id,
        check_in_lat=data.latitude,
        check_in_long=data.longitude
    )


    db.add(attendance)
    db.commit()
    db.refresh(attendance)


    return {
        "message": "Giriş başarılı",
        "distance": distance,
        "workplace": workplace.name
    }



# =========================
# CHECK-OUT
# =========================

@router.post("/check-out")
def check_out(
    data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Kullanıcının iş yeri atanmış mı?
    if current_user.workplace_id is None:
        raise HTTPException(
            status_code=400,
            detail="Kullanıcıya iş yeri atanmamış."
        )

    # Kullanıcının iş yerini al
    workplace = db.query(Workplace).filter(
        Workplace.id == current_user.workplace_id
    ).first()

    if not workplace:
        raise HTTPException(
            status_code=404,
            detail="İşyeri bulunamadı"
        )

    # Konum kontrolü
    distance = calculate_distance(
        data.latitude,
        data.longitude,
        workplace.latitude,
        workplace.longitude
    )

    if distance > workplace.radius:
        raise HTTPException(
            status_code=400,
            detail=f"İşyeri dışında. Mesafe: {int(distance)} metre"
        )

    # Açık giriş kaydı var mı?
    attendance = db.query(Attendance).filter(
        Attendance.user_id == current_user.id,
        Attendance.check_out_time == None
    ).first()

    if not attendance:
        raise HTTPException(
            status_code=400,
            detail="Aktif giriş kaydı bulunamadı"
        )

    # Çıkış işlemi
    attendance.check_out_lat = data.latitude
    attendance.check_out_long = data.longitude
    attendance.check_out_time = datetime.now()

    # Çalışma süresi
    work_duration = attendance.check_out_time - attendance.check_in_time

    db.commit()
    db.refresh(attendance)

    return {
        "message": "Çıkış başarılı",
        "check_out_time": attendance.check_out_time,
        "work_duration": str(work_duration),
        "distance": round(distance, 2)
    }



# =========================
# KENDİ ATTENDANCE KAYITLARI
# =========================

@router.get("/my-attendance")
def my_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    records = db.query(Attendance).filter(
        Attendance.user_id == current_user.id
    ).all()


    result = []


    for record in records:

        duration = None


        if record.check_out_time:

            total_seconds = (
                record.check_out_time -
                record.check_in_time
            ).total_seconds()


            hours = int(total_seconds // 3600)

            minutes = int(
                (total_seconds % 3600) // 60
            )


            duration = f"{hours} saat {minutes} dakika"



        result.append({
            "id": record.id,
            "check_in": record.check_in_time,
            "check_out": record.check_out_time,
            "duration": duration
        })


    return result



# =========================
# ADMIN TÜM KAYITLAR
# =========================

@router.get("/all")
def get_all_attendance(
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):

    records = db.query(
        Attendance,
        User
    ).join(
        User,
        Attendance.user_id == User.id
    ).all()


    result = []


    for attendance, user in records:

        duration = None


        if attendance.check_out_time:

            total_seconds = (
                attendance.check_out_time -
                attendance.check_in_time
            ).total_seconds()


            hours = int(total_seconds // 3600)

            minutes = int(
                (total_seconds % 3600) // 60
            )


            duration = f"{hours} saat {minutes} dakika"



        result.append({
            "personel": f"{user.name} {user.surname}",
            "email": user.email,
            "check_in": attendance.check_in_time,
            "check_out": attendance.check_out_time,
            "duration": duration
        })


    return result