from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from ..database import get_db
from ..models import Leave, User
from ..schemas import (
    LeaveCreate,
    LeaveResponse,
    AdminLeaveResponse,
    LeaveActionResponse
)
from ..security import get_current_user, admin_required


router = APIRouter(
    prefix="/leave",
    tags=["Leave"]
)



# =========================
# İZİN TALEBİ OLUŞTUR
# =========================


@router.post(
    "/",
    response_model=LeaveResponse
)
def create_leave(

    data: LeaveCreate,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)

):


    if data.start_date < date.today():

        raise HTTPException(

            status_code=400,

            detail="Geçmiş tarihli izin oluşturulamaz."

        )



    if data.end_date < data.start_date:

        raise HTTPException(

            status_code=400,

            detail="Bitiş tarihi başlangıçtan önce olamaz."

        )



    leave = Leave(

        user_id=current_user.id,

        start_date=data.start_date,

        end_date=data.end_date,

        reason=data.reason,

        status="pending"

    )



    db.add(leave)

    db.commit()

    db.refresh(leave)



    return leave





# =========================
# PERSONEL KENDİ İZİNLERİ
# =========================


@router.get(
    "/my",
    response_model=list[LeaveResponse]
)
def my_leaves(

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user)

):


    leaves = db.query(
        Leave
    ).filter(

        Leave.user_id == current_user.id

    ).order_by(

        Leave.created_at.desc()

    ).all()



    return leaves





# =========================
# ADMIN TÜM İZİNLER
# =========================


@router.get(
    "/all",
    response_model=list[AdminLeaveResponse]
)
def all_leaves(

    db: Session = Depends(get_db),

    admin: User = Depends(admin_required)

):


    records = db.query(

        Leave,

        User

    ).join(

        User,

        Leave.user_id == User.id

    ).order_by(

        Leave.created_at.desc()

    ).all()



    result = []



    for leave,user in records:


        result.append({


            "id":
                leave.id,


            "personel":
                f"{user.name} {user.surname}",


            "email":
                user.email,


            "start_date":
                leave.start_date,


            "end_date":
                leave.end_date,


            "reason":
                leave.reason,


            "status":
                leave.status,


            "created_at":
                leave.created_at

        })



    return result





# =========================
# ADMIN BEKLEYEN İZİNLER
# =========================


@router.get(
    "/pending",
    response_model=list[AdminLeaveResponse]
)
def pending_leaves(

    db: Session = Depends(get_db),

    admin: User = Depends(admin_required)

):


    records = db.query(

        Leave,

        User

    ).join(

        User,

        Leave.user_id == User.id

    ).filter(

        Leave.status == "pending"

    ).all()



    result = []



    for leave,user in records:


        result.append({


            "id":
                leave.id,


            "personel":
                f"{user.name} {user.surname}",


            "email":
                user.email,


            "start_date":
                leave.start_date,


            "end_date":
                leave.end_date,


            "reason":
                leave.reason,


            "status":
                leave.status,


            "created_at":
                leave.created_at

        })



    return result





# =========================
# İZİN ONAYLA
# =========================


@router.put(
    "/{leave_id}/approve",
    response_model=LeaveActionResponse
)
def approve_leave(

    leave_id: int,

    db: Session = Depends(get_db),

    admin: User = Depends(admin_required)

):


    leave = db.query(
        Leave
    ).filter(

        Leave.id == leave_id

    ).first()



    if not leave:

        raise HTTPException(

            status_code=404,

            detail="İzin bulunamadı"

        )



    leave.status = "approved"



    db.commit()

    db.refresh(leave)



    return {


        "message":
            "İzin onaylandı",


        "leave_id":
            leave.id,


        "status":
            leave.status

    }





# =========================
# İZİN REDDET
# =========================


@router.put(
    "/{leave_id}/reject",
    response_model=LeaveActionResponse
)
def reject_leave(

    leave_id: int,

    db: Session = Depends(get_db),

    admin: User = Depends(admin_required)

):


    leave = db.query(
        Leave
    ).filter(

        Leave.id == leave_id

    ).first()



    if not leave:

        raise HTTPException(

            status_code=404,

            detail="İzin bulunamadı"

        )



    leave.status = "rejected"



    db.commit()

    db.refresh(leave)



    return {


        "message":
            "İzin reddedildi",


        "leave_id":
            leave.id,


        "status":
            leave.status

    }