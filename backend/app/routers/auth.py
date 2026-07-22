from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserLogin
from ..security import create_access_token


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


@router.post("/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Bu e-posta adresi zaten kayıtlı."
        )


    hashed_password = pwd_context.hash(
        user.password
    )


    new_user = User(
        name=user.name,
        surname=user.surname,
        email=user.email,
        password=hashed_password,
        role="employee"
    )


    db.add(new_user)

    db.commit()

    db.refresh(new_user)


    return {
        "message": "Kullanıcı oluşturuldu",
        "user_id": new_user.id
    }


@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):

    db_user = db.query(User).filter(
        User.email == user.email
    ).first()


    if not db_user:

        raise HTTPException(
            status_code=400,
            detail="Kullanıcı bulunamadı"
        )


    if not pwd_context.verify(
        user.password,
        db_user.password
    ):

        raise HTTPException(
            status_code=400,
            detail="Şifre yanlış"
        )


    user_role = (
        db_user.role or "employee"
    )


    token = create_access_token(
        {
            "sub": db_user.email,
            "user_id": db_user.id,
            "role": user_role
        }
    )


    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user_role,
        "user": {
            "id": db_user.id,
            "name": db_user.name,
            "surname": db_user.surname,
            "full_name": (
                f"{db_user.name} {db_user.surname}"
            ),
            "email": db_user.email,
            "role": user_role,
            "workplace_id": db_user.workplace_id
        }
    }