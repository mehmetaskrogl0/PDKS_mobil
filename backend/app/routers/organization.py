from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import (
    Department,
    Directorate,
    JobTitle,
    OrganizationUnit,
    User
)
from ..schemas import (
    DepartmentCreate,
    DepartmentResponse,
    DepartmentTreeItem,
    DepartmentUpdate,
    DirectorateCreate,
    DirectorateResponse,
    DirectorateUpdate,
    JobTitleCreate,
    JobTitleResponse,
    JobTitleUpdate,
    OrganizationUnitCreate,
    OrganizationUnitResponse,
    OrganizationUnitUpdate
)
from ..security import admin_required, get_current_user


router = APIRouter(
    prefix="/organization",
    tags=["Organization"]
)


def clean_text(value: str | None):
    if value is None:
        return None
    value = value.strip()
    return value or None


def commit_or_integrity_error(db: Session, detail: str):
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail=detail)


def get_department(db: Session, department_id: int):
    item = db.query(Department).filter(Department.id == department_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Daire başkanlığı bulunamadı.")
    return item


def get_directorate(db: Session, directorate_id: int):
    item = db.query(Directorate).filter(Directorate.id == directorate_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Müdürlük bulunamadı.")
    return item


def get_unit(db: Session, unit_id: int):
    item = db.query(OrganizationUnit).filter(OrganizationUnit.id == unit_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Birim bulunamadı.")
    return item


def get_job_title(db: Session, job_title_id: int):
    item = db.query(JobTitle).filter(JobTitle.id == job_title_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Unvan bulunamadı.")
    return item


def department_response(item: Department):
    return {
        "id": item.id,
        "name": item.name,
        "code": item.code,
        "description": item.description,
        "is_active": item.is_active,
        "directorate_count": len(item.directorates),
        "personnel_count": len(item.users),
        "created_at": item.created_at,
        "updated_at": item.updated_at
    }


def directorate_response(item: Directorate):
    return {
        "id": item.id,
        "name": item.name,
        "code": item.code,
        "description": item.description,
        "department_id": item.department_id,
        "department_name": item.department.name if item.department else None,
        "is_active": item.is_active,
        "unit_count": len(item.units),
        "personnel_count": len(item.users),
        "created_at": item.created_at,
        "updated_at": item.updated_at
    }


def unit_response(item: OrganizationUnit):
    directorate = item.directorate
    department = directorate.department if directorate else None
    return {
        "id": item.id,
        "name": item.name,
        "code": item.code,
        "description": item.description,
        "directorate_id": item.directorate_id,
        "directorate_name": directorate.name if directorate else None,
        "department_id": department.id if department else None,
        "department_name": department.name if department else None,
        "is_active": item.is_active,
        "personnel_count": len(item.users),
        "created_at": item.created_at,
        "updated_at": item.updated_at
    }


def job_title_response(item: JobTitle):
    return {
        "id": item.id,
        "name": item.name,
        "code": item.code,
        "description": item.description,
        "level": item.level,
        "is_manager": item.is_manager,
        "is_active": item.is_active,
        "personnel_count": len(item.users),
        "created_at": item.created_at,
        "updated_at": item.updated_at
    }


@router.get("/departments", response_model=list[DepartmentResponse])
def list_departments(
    active_only: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Department).options(
        joinedload(Department.directorates),
        joinedload(Department.users)
    )
    if active_only:
        query = query.filter(Department.is_active.is_(True))
    items = query.order_by(Department.name.asc()).all()
    return [department_response(item) for item in items]


@router.post("/departments", response_model=DepartmentResponse)
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):
    item = Department(
        name=data.name.strip(),
        code=clean_text(data.code),
        description=clean_text(data.description),
        is_active=data.is_active
    )
    db.add(item)
    commit_or_integrity_error(db, "Bu daire adı veya kodu zaten kullanılıyor.")
    db.refresh(item)
    return department_response(item)


@router.put("/departments/{department_id}", response_model=DepartmentResponse)
def update_department(
    department_id: int,
    data: DepartmentUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):
    item = get_department(db, department_id)
    values = data.model_dump(exclude_unset=True)
    if "name" in values:
        item.name = values["name"].strip()
    if "code" in values:
        item.code = clean_text(values["code"])
    if "description" in values:
        item.description = clean_text(values["description"])
    if "is_active" in values:
        item.is_active = values["is_active"]
    commit_or_integrity_error(db, "Bu daire adı veya kodu zaten kullanılıyor.")
    db.refresh(item)
    return department_response(item)


@router.delete("/departments/{department_id}")
def delete_department(
    department_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):
    item = get_department(db, department_id)
    if item.directorates or item.users:
        raise HTTPException(status_code=400, detail="Bağlı müdürlük veya personel bulunan daire silinemez.")
    db.delete(item)
    db.commit()
    return {"message": "Daire başkanlığı silindi."}


@router.get("/directorates", response_model=list[DirectorateResponse])
def list_directorates(
    department_id: int | None = Query(default=None),
    active_only: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Directorate).options(
        joinedload(Directorate.department),
        joinedload(Directorate.units),
        joinedload(Directorate.users)
    )
    if department_id is not None:
        query = query.filter(Directorate.department_id == department_id)
    if active_only:
        query = query.filter(Directorate.is_active.is_(True))
    items = query.order_by(Directorate.name.asc()).all()
    return [directorate_response(item) for item in items]


@router.post("/directorates", response_model=DirectorateResponse)
def create_directorate(
    data: DirectorateCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):
    get_department(db, data.department_id)
    item = Directorate(
        name=data.name.strip(),
        code=clean_text(data.code),
        description=clean_text(data.description),
        department_id=data.department_id,
        is_active=data.is_active
    )
    db.add(item)
    commit_or_integrity_error(db, "Bu müdürlük adı veya kodu zaten kullanılıyor.")
    db.refresh(item)
    return directorate_response(item)


@router.put("/directorates/{directorate_id}", response_model=DirectorateResponse)
def update_directorate(
    directorate_id: int,
    data: DirectorateUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):
    item = get_directorate(db, directorate_id)
    values = data.model_dump(exclude_unset=True)
    if "department_id" in values:
        get_department(db, values["department_id"])
        item.department_id = values["department_id"]
    if "name" in values:
        item.name = values["name"].strip()
    if "code" in values:
        item.code = clean_text(values["code"])
    if "description" in values:
        item.description = clean_text(values["description"])
    if "is_active" in values:
        item.is_active = values["is_active"]
    commit_or_integrity_error(db, "Bu müdürlük adı veya kodu zaten kullanılıyor.")
    db.refresh(item)
    return directorate_response(item)


@router.delete("/directorates/{directorate_id}")
def delete_directorate(
    directorate_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):
    item = get_directorate(db, directorate_id)
    if item.units or item.users:
        raise HTTPException(status_code=400, detail="Bağlı birim veya personel bulunan müdürlük silinemez.")
    db.delete(item)
    db.commit()
    return {"message": "Müdürlük silindi."}


@router.get("/units", response_model=list[OrganizationUnitResponse])
def list_units(
    directorate_id: int | None = Query(default=None),
    active_only: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(OrganizationUnit).options(
        joinedload(OrganizationUnit.directorate).joinedload(Directorate.department),
        joinedload(OrganizationUnit.users)
    )
    if directorate_id is not None:
        query = query.filter(OrganizationUnit.directorate_id == directorate_id)
    if active_only:
        query = query.filter(OrganizationUnit.is_active.is_(True))
    items = query.order_by(OrganizationUnit.name.asc()).all()
    return [unit_response(item) for item in items]


@router.post("/units", response_model=OrganizationUnitResponse)
def create_unit(
    data: OrganizationUnitCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):
    get_directorate(db, data.directorate_id)
    item = OrganizationUnit(
        name=data.name.strip(),
        code=clean_text(data.code),
        description=clean_text(data.description),
        directorate_id=data.directorate_id,
        is_active=data.is_active
    )
    db.add(item)
    commit_or_integrity_error(db, "Bu birim adı veya kodu zaten kullanılıyor.")
    db.refresh(item)
    return unit_response(item)


@router.put("/units/{unit_id}", response_model=OrganizationUnitResponse)
def update_unit(
    unit_id: int,
    data: OrganizationUnitUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):
    item = get_unit(db, unit_id)
    values = data.model_dump(exclude_unset=True)
    if "directorate_id" in values:
        get_directorate(db, values["directorate_id"])
        item.directorate_id = values["directorate_id"]
    if "name" in values:
        item.name = values["name"].strip()
    if "code" in values:
        item.code = clean_text(values["code"])
    if "description" in values:
        item.description = clean_text(values["description"])
    if "is_active" in values:
        item.is_active = values["is_active"]
    commit_or_integrity_error(db, "Bu birim adı veya kodu zaten kullanılıyor.")
    db.refresh(item)
    return unit_response(item)


@router.delete("/units/{unit_id}")
def delete_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):
    item = get_unit(db, unit_id)
    if item.users:
        raise HTTPException(status_code=400, detail="Personel atanmış birim silinemez.")
    db.delete(item)
    db.commit()
    return {"message": "Birim silindi."}


@router.get("/job-titles", response_model=list[JobTitleResponse])
def list_job_titles(
    active_only: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(JobTitle).options(joinedload(JobTitle.users))
    if active_only:
        query = query.filter(JobTitle.is_active.is_(True))
    items = query.order_by(JobTitle.level.desc(), JobTitle.name.asc()).all()
    return [job_title_response(item) for item in items]


@router.post("/job-titles", response_model=JobTitleResponse)
def create_job_title(
    data: JobTitleCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):
    item = JobTitle(
        name=data.name.strip(),
        code=clean_text(data.code),
        description=clean_text(data.description),
        level=data.level,
        is_manager=data.is_manager,
        is_active=data.is_active
    )
    db.add(item)
    commit_or_integrity_error(db, "Bu unvan adı veya kodu zaten kullanılıyor.")
    db.refresh(item)
    return job_title_response(item)


@router.put("/job-titles/{job_title_id}", response_model=JobTitleResponse)
def update_job_title(
    job_title_id: int,
    data: JobTitleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):
    item = get_job_title(db, job_title_id)
    values = data.model_dump(exclude_unset=True)
    if "name" in values:
        item.name = values["name"].strip()
    if "code" in values:
        item.code = clean_text(values["code"])
    if "description" in values:
        item.description = clean_text(values["description"])
    if "level" in values:
        item.level = values["level"]
    if "is_manager" in values:
        item.is_manager = values["is_manager"]
    if "is_active" in values:
        item.is_active = values["is_active"]
    commit_or_integrity_error(db, "Bu unvan adı veya kodu zaten kullanılıyor.")
    db.refresh(item)
    return job_title_response(item)


@router.delete("/job-titles/{job_title_id}")
def delete_job_title(
    job_title_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):
    item = get_job_title(db, job_title_id)
    if item.users:
        raise HTTPException(status_code=400, detail="Personele atanmış unvan silinemez.")
    db.delete(item)
    db.commit()
    return {"message": "Unvan silindi."}


@router.get("/tree", response_model=list[DepartmentTreeItem])
def organization_tree(
    active_only: bool = Query(default=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Department).options(
        joinedload(Department.users),
        joinedload(Department.directorates).joinedload(Directorate.users),
        joinedload(Department.directorates).joinedload(Directorate.units).joinedload(OrganizationUnit.users)
    )
    if active_only:
        query = query.filter(Department.is_active.is_(True))
    departments = query.order_by(Department.name.asc()).all()
    result = []
    for department in departments:
        department_data = department_response(department)
        department_data["directorates"] = []
        directorates = sorted(department.directorates, key=lambda x: x.name.lower())
        for directorate in directorates:
            if active_only and not directorate.is_active:
                continue
            directorate_data = directorate_response(directorate)
            directorate_data["units"] = []
            units = sorted(directorate.units, key=lambda x: x.name.lower())
            for unit in units:
                if active_only and not unit.is_active:
                    continue
                directorate_data["units"].append(unit_response(unit))
            department_data["directorates"].append(directorate_data)
        result.append(department_data)
    return result