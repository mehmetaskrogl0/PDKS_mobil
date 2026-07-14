from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Workplace
from ..security import get_current_user, admin_required


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user)
):

    return {
        "id": current_user.id,
        "name": current_user.name,
        "surname": current_user.surname,
        "email": current_user.email,
        "role": current_user.role
    }
@router.put("/{user_id}/workplace")
def assign_workplace(
    user_id: int,
    workplace_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()


    if not user:
        raise HTTPException(
            status_code=404,
            detail="Kullanıcı bulunamadı"
        )


    workplace = db.query(Workplace).filter(
        Workplace.id == workplace_id
    ).first()


    if not workplace:
        raise HTTPException(
            status_code=404,
            detail="İşyeri bulunamadı"
        )


    user.workplace_id = workplace_id

    db.commit()
    db.refresh(user)


    return {
        "message": "Kullanıcı iş yerine atandı"
    }