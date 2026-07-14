from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Leave, User
from ..schemas import LeaveCreate, LeaveResponse
from ..security import get_current_user


router = APIRouter(
    prefix="/leave",
    tags=["Leave"]
)
@router.post("/", response_model=LeaveResponse)
def create_leave(
    data: LeaveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

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

@router.get("/my", response_model=list[LeaveResponse])
def my_leaves(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    leaves = db.query(Leave).filter(
        Leave.user_id == current_user.id
    ).all()

    return leaves

@router.get("/all", response_model=list[LeaveResponse])
def all_leaves(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Yetkiniz yok"
        )

    return db.query(Leave).all()

@router.put("/{leave_id}/approve")
def approve_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Yetkiniz yok"
        )


    leave = db.query(Leave).filter(
        Leave.id == leave_id
    ).first()


    if not leave:
        raise HTTPException(
            status_code=404,
            detail="İzin bulunamadı"
        )


    leave.status = "approved"

    db.commit()

    return {
        "message": "İzin onaylandı"
    }
@router.put("/{leave_id}/reject")
def reject_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Yetkiniz yok"
        )


    leave = db.query(Leave).filter(
        Leave.id == leave_id
    ).first()


    if not leave:
        raise HTTPException(
            status_code=404,
            detail="İzin bulunamadı"
        )


    leave.status = "rejected"

    db.commit()

    return {
        "message": "İzin reddedildi"
    }