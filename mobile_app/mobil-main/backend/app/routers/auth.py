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


    token = create_access_token(
        {
            "sub": db_user.email
        }
    )


    return {
        "access_token": token,
        "token_type": "bearer"
    }