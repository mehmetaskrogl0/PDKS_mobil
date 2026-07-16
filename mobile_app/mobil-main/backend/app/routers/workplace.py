from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Workplace, User
from ..schemas import (
    WorkplaceCreate,
    WorkplaceResponse,
    WorkplaceActionResponse
)
from ..security import admin_required


router = APIRouter(
    prefix="/workplaces",
    tags=["Workplaces"]
)





# =========================
# İŞYERİ EKLE
# =========================


@router.post(
    "/",
    response_model=WorkplaceResponse
)
def create_workplace(

    data: WorkplaceCreate,

    db: Session = Depends(get_db),

    admin: User = Depends(admin_required)

):


    existing = db.query(Workplace).filter(

        Workplace.name == data.name

    ).first()



    if existing:

        raise HTTPException(

            status_code=400,

            detail="Bu isimde işyeri zaten var"

        )




    workplace = Workplace(

        name=data.name,

        latitude=data.latitude,

        longitude=data.longitude,

        radius=data.radius,

        start_time=data.start_time

    )



    db.add(workplace)

    db.commit()

    db.refresh(workplace)



    return workplace





# =========================
# TÜM İŞYERLERİ GETİR
# =========================


@router.get(
    "/",
    response_model=list[WorkplaceResponse]
)
def get_workplaces(

    db: Session = Depends(get_db),

    admin: User = Depends(admin_required)

):


    return db.query(
        Workplace
    ).all()





# =========================
# TEK İŞYERİ GETİR
# =========================


@router.get(
    "/{workplace_id}",
    response_model=WorkplaceResponse
)
def get_workplace(

    workplace_id:int,

    db:Session = Depends(get_db),

    admin:User = Depends(admin_required)

):


    workplace = db.query(
        Workplace
    ).filter(

        Workplace.id == workplace_id

    ).first()



    if not workplace:

        raise HTTPException(

            status_code=404,

            detail="İşyeri bulunamadı"

        )



    return workplace





# =========================
# İŞYERİ GÜNCELLE
# =========================


@router.put(
    "/{workplace_id}",
    response_model=WorkplaceActionResponse
)
def update_workplace(

    workplace_id:int,

    data:WorkplaceCreate,

    db:Session = Depends(get_db),

    admin:User = Depends(admin_required)

):


    workplace = db.query(
        Workplace
    ).filter(

        Workplace.id == workplace_id

    ).first()



    if not workplace:

        raise HTTPException(

            status_code=404,

            detail="İşyeri bulunamadı"

        )




    workplace.name = data.name

    workplace.latitude = data.latitude

    workplace.longitude = data.longitude

    workplace.radius = data.radius

    workplace.start_time = data.start_time




    db.commit()

    db.refresh(workplace)



    return {

        "message":
            "İşyeri güncellendi",

        "workplace_id":
            workplace.id

    }





# =========================
# İŞYERİ SİL
# =========================


@router.delete(
    "/{workplace_id}",
    response_model=WorkplaceActionResponse
)
def delete_workplace(

    workplace_id:int,

    db:Session = Depends(get_db),

    admin:User = Depends(admin_required)

):


    workplace = db.query(
        Workplace
    ).filter(

        Workplace.id == workplace_id

    ).first()



    if not workplace:

        raise HTTPException(

            status_code=404,

            detail="İşyeri bulunamadı"

        )



    db.delete(workplace)

    db.commit()



    return {


        "message":
            "İşyeri silindi",


        "workplace_id":
            workplace_id

    }