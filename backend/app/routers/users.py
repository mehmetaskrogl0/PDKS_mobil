from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Workplace
from ..security import (
    get_current_user,
    admin_required,
    hash_password
)

from ..logger import create_log

from ..schemas import (
    AdminUserCreate,
    UserUpdate,
    UserResponse,
    UserActionResponse
)



router = APIRouter(
    prefix="/users",
    tags=["Users"]
)





# =========================
# KENDİ BİLGİLERİNİ GETİR
# =========================


@router.get(
    "/me",
    response_model=UserResponse
)
def get_me(

    current_user: User = Depends(get_current_user)

):

    return current_user






# =========================
# TÜM KULLANICILAR
# =========================


@router.get(
    "/",
    response_model=list[UserResponse]
)
def get_users(

    db: Session = Depends(get_db),

    admin: User = Depends(admin_required)

):


    return db.query(User).all()







# =========================
# TEK KULLANICI
# =========================


@router.get(
    "/{user_id}",
    response_model=UserResponse
)
def get_user(

    user_id:int,

    db:Session = Depends(get_db),

    admin:User = Depends(admin_required)

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








# =========================
# KULLANICI OLUŞTUR
# =========================


@router.post(
    "/",
    response_model=UserActionResponse
)
def create_user(

    user_data:AdminUserCreate,

    db:Session = Depends(get_db),

    admin:User = Depends(admin_required)

):


    existing = db.query(User).filter(

        User.email == user_data.email

    ).first()



    if existing:

        raise HTTPException(

            status_code=400,

            detail="Bu email zaten kayıtlı"

        )




    new_user = User(

        name=user_data.name,

        surname=user_data.surname,

        email=user_data.email,

        password=hash_password(
            user_data.password
        ),

        role=user_data.role,

        workplace_id=user_data.workplace_id

    )



    db.add(new_user)

    db.commit()

    db.refresh(new_user)



    create_log(

        db,

        admin.id,

        "USER_CREATE",

        f"{new_user.name} {new_user.surname} oluşturuldu"

    )



    return {

        "message":
        "Kullanıcı oluşturuldu",

        "user_id":
        new_user.id

    }









# =========================
# İŞ YERİ ATAMA
# =========================


@router.put(
    "/{user_id}/workplace",
    response_model=UserActionResponse
)
def assign_workplace(

    user_id:int,

    workplace_id:int,

    db:Session = Depends(get_db),

    admin:User = Depends(admin_required)

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



    create_log(

        db,

        admin.id,

        "WORKPLACE_ASSIGN",

        f"{user.name} {user.surname} iş yerine atandı"

    )



    return {

        "message":
        "Kullanıcı iş yerine atandı",

        "user_id":
        user.id

    }









# =========================
# KULLANICI GÜNCELLE
# =========================


@router.put(
    "/{user_id}",
    response_model=UserActionResponse
)
def update_user(

    user_id:int,

    user_data:UserUpdate,

    db:Session = Depends(get_db),

    admin:User = Depends(admin_required)

):


    user = db.query(User).filter(

        User.id == user_id

    ).first()



    if not user:

        raise HTTPException(

            status_code=404,

            detail="Kullanıcı bulunamadı"

        )




    data = user_data.dict(
        exclude_unset=True
    )



    if "email" in data:


        exists = db.query(User).filter(

            User.email == data["email"],

            User.id != user_id

        ).first()



        if exists:

            raise HTTPException(

                status_code=400,

                detail="Email kullanılıyor"

            )




    if "password" in data:

        user.password = hash_password(

            data["password"]

        )

        del data["password"]




    for field,value in data.items():

        setattr(

            user,

            field,

            value

        )



    db.commit()

    db.refresh(user)



    create_log(

        db,

        admin.id,

        "USER_UPDATE",

        f"{user.name} {user.surname} güncellendi"

    )



    return {

        "message":
        "Kullanıcı güncellendi",

        "user_id":
        user.id

    }









# =========================
# KULLANICI SİL
# =========================


@router.delete(
    "/{user_id}",
    response_model=UserActionResponse
)
def delete_user(

    user_id:int,

    db:Session = Depends(get_db),

    admin:User = Depends(admin_required)

):


    user = db.query(User).filter(

        User.id == user_id

    ).first()



    if not user:

        raise HTTPException(

            status_code=404,

            detail="Kullanıcı bulunamadı"

        )



    username = (
        user.name 
        + 
        " "
        + 
        user.surname
    )



    db.delete(user)

    db.commit()



    create_log(

        db,

        admin.id,

        "USER_DELETE",

        f"{username} silindi"

    )



    return {

        "message":
        "Kullanıcı silindi",

        "user_id":
        user_id

    }