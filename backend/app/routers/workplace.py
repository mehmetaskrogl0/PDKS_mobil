from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Workplace, User
from ..security import admin_required


router = APIRouter(
    prefix="/workplaces",
    tags=["Workplaces"]
)



# ADMIN İŞYERİ EKLER

@router.post("/")
def create_workplace(
    name: str,
    latitude: float,
    longitude: float,
    radius: int,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):

    workplace = Workplace(
        name=name,
        latitude=latitude,
        longitude=longitude,
        radius=radius
    )


    db.add(workplace)
    db.commit()
    db.refresh(workplace)


    return {
        "message": "İşyeri oluşturuldu",
        "id": workplace.id
    }



# TÜM İŞYERLERİN LİSTESİ

@router.get("/")
def get_workplaces(
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):

    workplaces = db.query(Workplace).all()

    return workplaces
# İŞYERİ GÜNCELLEME

@router.put("/{workplace_id}")
def update_workplace(
    workplace_id: int,
    name: str,
    latitude: float,
    longitude: float,
    radius: int,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):

    workplace = db.query(Workplace).filter(
        Workplace.id == workplace_id
    ).first()


    if not workplace:
        raise HTTPException(
            status_code=404,
            detail="İşyeri bulunamadı"
        )


    workplace.name = name
    workplace.latitude = latitude
    workplace.longitude = longitude
    workplace.radius = radius


    db.commit()
    db.refresh(workplace)


    return {
        "message": "İşyeri güncellendi"
    }



# İŞYERİ SİLME

@router.delete("/{workplace_id}")
def delete_workplace(
    workplace_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):

    workplace = db.query(Workplace).filter(
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
        "message": "İşyeri silindi"
    }