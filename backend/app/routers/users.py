from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Workplace
from ..security import get_current_user, admin_required, hash_password
from ..schemas import AdminUserCreate, UserUpdate

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# Kendi bilgilerini getir
@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user)
):

    return {
        "id": current_user.id,
        "name": current_user.name,
        "surname": current_user.surname,
        "email": current_user.email,
        "role": current_user.role,
        "workplace_id": current_user.workplace_id
    }



# Tüm kullanıcıları listele (Admin)
@router.get("/")
def get_users(
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):

    users = db.query(User).all()

    return users



# Tek kullanıcı getir (Admin)
@router.get("/{user_id}")
def get_user(
    user_id: int,
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


    return user



# Yeni kullanıcı oluştur (Admin)
@router.post("/")
def create_user(
    user_data: AdminUserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):

    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()


    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Bu email zaten kayıtlı"
        )


    new_user = User(
        name=user_data.name,
        surname=user_data.surname,
        email=user_data.email,
        password=hash_password(user_data.password),
        role=user_data.role,
        workplace_id=user_data.workplace_id
    )


    db.add(new_user)
    db.commit()
    db.refresh(new_user)


    return {
        "message": "Kullanıcı oluşturuldu",
        "user_id": new_user.id
    }



# Kullanıcıyı iş yerine ata (Admin)
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


@router.put("/{user_id}")
def update_user(
    user_id: int,
    user_data: UserUpdate,
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


    if user_data.name:
        user.name = user_data.name

    if user_data.surname:
        user.surname = user_data.surname

    if user_data.email:
        user.email = user_data.email

    if user_data.role:
        user.role = user_data.role

    if user_data.workplace_id:
        user.workplace_id = user_data.workplace_id

    if user_data.password:
        user.password = hash_password(
            user_data.password
        )


    db.commit()
    db.refresh(user)


    return {
        "message": "Kullanıcı güncellendi"
    }
# Kullanıcı sil (Admin)
@router.delete("/{user_id}")
def delete_user(
    user_id: int,
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


    db.delete(user)
    db.commit()


    return {
        "message": "Kullanıcı silindi"
    }