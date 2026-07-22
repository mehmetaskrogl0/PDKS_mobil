from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status
)

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import (
    Shift,
    ShiftAssignment,
    User,
    Team,
    Workplace,
    SystemLog
)
from ..schemas import (
    ShiftCreate,
    ShiftUpdate,
    ShiftResponse,
    ShiftDetailResponse,
    ShiftActionResponse,
    ShiftAssignmentCreate,
    ShiftAssignmentUpdate,
    ShiftAssignmentResponse,
    ShiftAssignmentActionResponse,
    CurrentShiftResponse
)
from ..security import get_current_user


router = APIRouter(
    prefix="/shifts",
    tags=["Shifts"]
)


# =========================
# HELPER FUNCTIONS
# =========================


def require_admin(
    current_user: User
):

    if current_user.role != "admin":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için admin yetkisi gereklidir."
        )


def add_system_log(
    db: Session,
    user_id: int | None,
    action: str,
    description: str | None = None
):

    log = SystemLog(
        user_id=user_id,
        action=action,
        description=description
    )

    db.add(log)


def get_shift_or_404(
    db: Session,
    shift_id: int
):

    shift = (
        db.query(Shift)
        .options(
            joinedload(Shift.workplace),
            joinedload(Shift.assignments)
        )
        .filter(
            Shift.id == shift_id
        )
        .first()
    )

    if not shift:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vardiya bulunamadı."
        )

    return shift


def get_assignment_or_404(
    db: Session,
    assignment_id: int
):

    assignment = (
        db.query(ShiftAssignment)
        .options(
            joinedload(ShiftAssignment.shift),
            joinedload(ShiftAssignment.user),
            joinedload(ShiftAssignment.team)
        )
        .filter(
            ShiftAssignment.id == assignment_id
        )
        .first()
    )

    if not assignment:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vardiya ataması bulunamadı."
        )

    return assignment


def validate_assignment_target(
    user_id: int | None,
    team_id: int | None
):

    if user_id is None and team_id is None:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Vardiya ataması için personel veya ekip "
                "seçilmelidir."
            )
        )

    if user_id is not None and team_id is not None:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Bir atama aynı anda hem personele "
                "hem de ekibe yapılamaz."
            )
        )


def validate_date_range(
    start_date: date,
    end_date: date | None
):

    if end_date and end_date < start_date:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Bitiş tarihi başlangıç tarihinden "
                "önce olamaz."
            )
        )


def validate_shift_name(
    db: Session,
    name: str,
    exclude_shift_id: int | None = None
):

    query = db.query(Shift).filter(
        Shift.name == name.strip()
    )

    if exclude_shift_id is not None:

        query = query.filter(
            Shift.id != exclude_shift_id
        )

    existing_shift = query.first()

    if existing_shift:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu isimde bir vardiya zaten mevcut."
        )


def validate_workplace(
    db: Session,
    workplace_id: int | None
):

    if workplace_id is None:

        return None

    workplace = (
        db.query(Workplace)
        .filter(
            Workplace.id == workplace_id
        )
        .first()
    )

    if not workplace:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="İş yeri bulunamadı."
        )

    return workplace


def validate_user(
    db: Session,
    user_id: int | None
):

    if user_id is None:

        return None

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Personel bulunamadı."
        )

    return user


def validate_team(
    db: Session,
    team_id: int | None
):

    if team_id is None:

        return None

    team = (
        db.query(Team)
        .filter(
            Team.id == team_id
        )
        .first()
    )

    if not team:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ekip bulunamadı."
        )

    return team


def check_assignment_overlap(
    db: Session,
    user_id: int | None,
    team_id: int | None,
    start_date: date,
    end_date: date | None,
    exclude_assignment_id: int | None = None
):

    query = db.query(ShiftAssignment).filter(
        ShiftAssignment.is_active.is_(True)
    )

    if user_id is not None:

        query = query.filter(
            ShiftAssignment.user_id == user_id
        )

    else:

        query = query.filter(
            ShiftAssignment.team_id == team_id
        )

    if exclude_assignment_id is not None:

        query = query.filter(
            ShiftAssignment.id != exclude_assignment_id
        )

    assignments = query.all()

    new_end_date = end_date or date.max

    for assignment in assignments:

        existing_end_date = (
            assignment.end_date or date.max
        )

        has_overlap = (
            start_date <= existing_end_date
            and assignment.start_date <= new_end_date
        )

        if has_overlap:

            target_text = (
                "personelin"
                if user_id is not None
                else "ekibin"
            )

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Bu {target_text} seçilen tarih "
                    "aralığında aktif bir vardiya ataması var."
                )
            )


def shift_to_response(
    shift: Shift
):

    return {
        "id": shift.id,
        "name": shift.name,
        "description": shift.description,
        "start_time": shift.start_time,
        "end_time": shift.end_time,
        "start_time_text": shift.start_time_text,
        "end_time_text": shift.end_time_text,
        "break_minutes": shift.break_minutes,
        "late_tolerance_minutes": (
            shift.late_tolerance_minutes
        ),
        "early_check_in_minutes": (
            shift.early_check_in_minutes
        ),
        "overtime_tolerance_minutes": (
            shift.overtime_tolerance_minutes
        ),
        "workplace_id": shift.workplace_id,
        "workplace_name": (
            shift.workplace.name
            if shift.workplace
            else None
        ),
        "is_active": shift.is_active,
        "is_overnight": shift.is_overnight,
        "created_at": shift.created_at,
        "updated_at": shift.updated_at
    }


def shift_detail_to_response(
    shift: Shift
):

    response = shift_to_response(
        shift
    )

    response["assignment_count"] = len(
        shift.assignments
    )

    return response


def assignment_to_response(
    assignment: ShiftAssignment
):

    return {
        "id": assignment.id,
        "shift_id": assignment.shift_id,
        "shift_name": (
            assignment.shift.name
            if assignment.shift
            else None
        ),
        "user_id": assignment.user_id,
        "team_id": assignment.team_id,
        "assignment_type": (
            assignment.assignment_type
        ),
        "assigned_name": (
            assignment.assigned_name
        ),
        "start_date": assignment.start_date,
        "end_date": assignment.end_date,
        "is_active": assignment.is_active,
        "notes": assignment.notes,
        "created_at": assignment.created_at,
        "updated_at": assignment.updated_at
    }


def get_assignment_period_status(
    assignment: ShiftAssignment,
    selected_date: date
):

    shift = assignment.shift

    if not assignment.is_active or not shift or not shift.is_active:

        return "passive"

    if assignment.start_date > selected_date:

        return "upcoming"

    if (
        assignment.end_date is not None
        and assignment.end_date < selected_date
    ):

        return "past"

    return "active"


# =========================
# CURRENT USER SHIFTS
# =========================


@router.get("/my")
def get_my_shift_assignments(
    active_only: bool = Query(
        default=False
    ),
    upcoming_only: bool = Query(
        default=False
    ),
    include_past: bool = Query(
        default=True
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    today = date.today()

    target_filters = [
        ShiftAssignment.user_id == current_user.id
    ]

    if current_user.team_id is not None:

        target_filters.append(
            ShiftAssignment.team_id
            == current_user.team_id
        )

    query = (
        db.query(ShiftAssignment)
        .join(
            Shift,
            Shift.id == ShiftAssignment.shift_id
        )
        .options(
            joinedload(
                ShiftAssignment.shift
            ).joinedload(
                Shift.workplace
            ),
            joinedload(
                ShiftAssignment.user
            ),
            joinedload(
                ShiftAssignment.team
            )
        )
        .filter(
            or_(
                *target_filters
            )
        )
    )

    if active_only:

        query = query.filter(
            ShiftAssignment.is_active.is_(True),
            Shift.is_active.is_(True),
            ShiftAssignment.start_date <= today,
            or_(
                ShiftAssignment.end_date.is_(None),
                ShiftAssignment.end_date >= today
            )
        )

    if upcoming_only:

        query = query.filter(
            ShiftAssignment.is_active.is_(True),
            Shift.is_active.is_(True),
            ShiftAssignment.start_date >= today
        )

    if not include_past:

        query = query.filter(
            or_(
                ShiftAssignment.end_date.is_(None),
                ShiftAssignment.end_date >= today
            )
        )

    assignments = (
        query
        .order_by(
            ShiftAssignment.start_date.asc(),
            ShiftAssignment.id.desc()
        )
        .all()
    )

    result = []

    for assignment in assignments:

        shift = assignment.shift

        if not shift:

            continue

        assignment_source = (
            "personel"
            if assignment.user_id == current_user.id
            else "ekip"
        )

        period_status = get_assignment_period_status(
            assignment,
            today
        )

        result.append({
            "id": assignment.id,
            "shift_id": assignment.shift_id,
            "shift_name": shift.name,
            "shift_description": shift.description,

            "user_id": assignment.user_id,
            "team_id": assignment.team_id,

            "assignment_type": (
                assignment.assignment_type
            ),
            "assignment_source": (
                assignment_source
            ),
            "assigned_name": (
                assignment.assigned_name
            ),

            "start_date": assignment.start_date,
            "end_date": assignment.end_date,

            "start_time": shift.start_time,
            "end_time": shift.end_time,
            "start_time_text": (
                shift.start_time_text
            ),
            "end_time_text": (
                shift.end_time_text
            ),

            "break_minutes": (
                shift.break_minutes
            ),
            "late_tolerance_minutes": (
                shift.late_tolerance_minutes
            ),
            "early_check_in_minutes": (
                shift.early_check_in_minutes
            ),
            "overtime_tolerance_minutes": (
                shift.overtime_tolerance_minutes
            ),

            "workplace_id": (
                shift.workplace_id
            ),
            "workplace_name": (
                shift.workplace.name
                if shift.workplace
                else None
            ),

            "is_overnight": (
                shift.is_overnight
            ),
            "shift_is_active": (
                shift.is_active
            ),
            "assignment_is_active": (
                assignment.is_active
            ),
            "period_status": (
                period_status
            ),

            "notes": assignment.notes,
            "created_at": assignment.created_at,
            "updated_at": assignment.updated_at
        })

    status_order = {
        "active": 0,
        "upcoming": 1,
        "past": 2,
        "passive": 3
    }

    result.sort(
        key=lambda item: (
            status_order.get(
                item["period_status"],
                4
            ),
            item["start_date"],
            item["id"]
        )
    )

    return result


@router.get(
    "/my/current",
    response_model=CurrentShiftResponse
)
def get_my_current_shift(
    target_date: date | None = Query(
        default=None
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    selected_date = target_date or date.today()

    base_filters = [
        ShiftAssignment.is_active.is_(True),
        Shift.is_active.is_(True),
        ShiftAssignment.start_date <= selected_date,
        or_(
            ShiftAssignment.end_date.is_(None),
            ShiftAssignment.end_date >= selected_date
        )
    ]

    user_assignment = (
        db.query(ShiftAssignment)
        .join(
            Shift,
            Shift.id == ShiftAssignment.shift_id
        )
        .options(
            joinedload(
                ShiftAssignment.shift
            )
        )
        .filter(
            *base_filters,
            ShiftAssignment.user_id
            == current_user.id
        )
        .order_by(
            ShiftAssignment.start_date.desc(),
            ShiftAssignment.id.desc()
        )
        .first()
    )

    assignment = user_assignment

    if (
        assignment is None
        and current_user.team_id
    ):

        assignment = (
            db.query(ShiftAssignment)
            .join(
                Shift,
                Shift.id
                == ShiftAssignment.shift_id
            )
            .options(
                joinedload(
                    ShiftAssignment.shift
                )
            )
            .filter(
                *base_filters,
                ShiftAssignment.team_id
                == current_user.team_id
            )
            .order_by(
                ShiftAssignment.start_date.desc(),
                ShiftAssignment.id.desc()
            )
            .first()
        )

    if not assignment:

        return {
            "message": (
                "Seçilen tarih için atanmış "
                "vardiya bulunamadı."
            )
        }

    shift = assignment.shift

    return {
        "assignment_id": assignment.id,
        "shift_id": shift.id,
        "shift_name": shift.name,
        "start_time": shift.start_time,
        "end_time": shift.end_time,
        "start_time_text": shift.start_time_text,
        "end_time_text": shift.end_time_text,
        "break_minutes": shift.break_minutes,
        "late_tolerance_minutes": (
            shift.late_tolerance_minutes
        ),
        "early_check_in_minutes": (
            shift.early_check_in_minutes
        ),
        "overtime_tolerance_minutes": (
            shift.overtime_tolerance_minutes
        ),
        "is_overnight": shift.is_overnight,
        "assignment_type": (
            assignment.assignment_type
        ),
        "start_date": assignment.start_date,
        "end_date": assignment.end_date,
        "message": "Aktif vardiya bulundu."
    }


# =========================
# SHIFT ASSIGNMENTS
# =========================


@router.get(
    "/assignments",
    response_model=list[
        ShiftAssignmentResponse
    ]
)
def list_shift_assignments(
    shift_id: int | None = Query(
        default=None
    ),
    user_id: int | None = Query(
        default=None
    ),
    team_id: int | None = Query(
        default=None
    ),
    active_only: bool = Query(
        default=False
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    require_admin(
        current_user
    )

    query = (
        db.query(ShiftAssignment)
        .options(
            joinedload(
                ShiftAssignment.shift
            ),
            joinedload(
                ShiftAssignment.user
            ),
            joinedload(
                ShiftAssignment.team
            )
        )
    )

    if shift_id is not None:

        query = query.filter(
            ShiftAssignment.shift_id
            == shift_id
        )

    if user_id is not None:

        query = query.filter(
            ShiftAssignment.user_id
            == user_id
        )

    if team_id is not None:

        query = query.filter(
            ShiftAssignment.team_id
            == team_id
        )

    if active_only:

        today = date.today()

        query = query.filter(
            ShiftAssignment.is_active.is_(True),
            ShiftAssignment.start_date <= today,
            or_(
                ShiftAssignment.end_date.is_(None),
                ShiftAssignment.end_date >= today
            )
        )

    assignments = (
        query
        .order_by(
            ShiftAssignment.start_date.desc(),
            ShiftAssignment.id.desc()
        )
        .all()
    )

    return [
        assignment_to_response(
            assignment
        )
        for assignment in assignments
    ]


@router.post(
    "/assignments",
    response_model=ShiftAssignmentActionResponse,
    status_code=status.HTTP_201_CREATED
)
def create_shift_assignment(
    data: ShiftAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    require_admin(
        current_user
    )

    validate_assignment_target(
        data.user_id,
        data.team_id
    )

    validate_date_range(
        data.start_date,
        data.end_date
    )

    shift = get_shift_or_404(
        db,
        data.shift_id
    )

    if not shift.is_active:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Pasif bir vardiya personele veya "
                "ekibe atanamaz."
            )
        )

    user = validate_user(
        db,
        data.user_id
    )

    team = validate_team(
        db,
        data.team_id
    )

    check_assignment_overlap(
        db=db,
        user_id=data.user_id,
        team_id=data.team_id,
        start_date=data.start_date,
        end_date=data.end_date
    )

    assignment = ShiftAssignment(
        shift_id=data.shift_id,
        user_id=data.user_id,
        team_id=data.team_id,
        start_date=data.start_date,
        end_date=data.end_date,
        is_active=data.is_active,
        notes=data.notes
    )

    db.add(
        assignment
    )

    assigned_name = (
        user.full_name
        if user
        else team.name
    )

    add_system_log(
        db=db,
        user_id=current_user.id,
        action="SHIFT_ASSIGNMENT_CREATED",
        description=(
            f"{shift.name} vardiyası "
            f"{assigned_name} için atandı."
        )
    )

    db.commit()
    db.refresh(
        assignment
    )

    return {
        "message": "Vardiya ataması oluşturuldu.",
        "assignment_id": assignment.id,
        "shift_id": assignment.shift_id,
        "user_id": assignment.user_id,
        "team_id": assignment.team_id
    }


@router.get(
    "/assignments/{assignment_id}",
    response_model=ShiftAssignmentResponse
)
def get_shift_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    require_admin(
        current_user
    )

    assignment = get_assignment_or_404(
        db,
        assignment_id
    )

    return assignment_to_response(
        assignment
    )


@router.put(
    "/assignments/{assignment_id}",
    response_model=ShiftAssignmentActionResponse
)
def update_shift_assignment(
    assignment_id: int,
    data: ShiftAssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    require_admin(
        current_user
    )

    assignment = get_assignment_or_404(
        db,
        assignment_id
    )

    update_data = data.model_dump(
        exclude_unset=True
    )

    new_shift_id = update_data.get(
        "shift_id",
        assignment.shift_id
    )

    new_user_id = update_data.get(
        "user_id",
        assignment.user_id
    )

    new_team_id = update_data.get(
        "team_id",
        assignment.team_id
    )

    if "user_id" in update_data:

        if update_data["user_id"] is not None:

            new_team_id = None

    if "team_id" in update_data:

        if update_data["team_id"] is not None:

            new_user_id = None

    validate_assignment_target(
        new_user_id,
        new_team_id
    )

    new_start_date = update_data.get(
        "start_date",
        assignment.start_date
    )

    new_end_date = update_data.get(
        "end_date",
        assignment.end_date
    )

    validate_date_range(
        new_start_date,
        new_end_date
    )

    shift = get_shift_or_404(
        db,
        new_shift_id
    )

    if not shift.is_active:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Pasif bir vardiya personele veya "
                "ekibe atanamaz."
            )
        )

    validate_user(
        db,
        new_user_id
    )

    validate_team(
        db,
        new_team_id
    )

    new_is_active = update_data.get(
        "is_active",
        assignment.is_active
    )

    if new_is_active:

        check_assignment_overlap(
            db=db,
            user_id=new_user_id,
            team_id=new_team_id,
            start_date=new_start_date,
            end_date=new_end_date,
            exclude_assignment_id=assignment.id
        )

    assignment.shift_id = new_shift_id
    assignment.user_id = new_user_id
    assignment.team_id = new_team_id
    assignment.start_date = new_start_date
    assignment.end_date = new_end_date

    if "is_active" in update_data:

        assignment.is_active = (
            update_data["is_active"]
        )

    if "notes" in update_data:

        assignment.notes = (
            update_data["notes"]
        )

    add_system_log(
        db=db,
        user_id=current_user.id,
        action="SHIFT_ASSIGNMENT_UPDATED",
        description=(
            f"{assignment.id} numaralı vardiya "
            "ataması güncellendi."
        )
    )

    db.commit()
    db.refresh(
        assignment
    )

    return {
        "message": "Vardiya ataması güncellendi.",
        "assignment_id": assignment.id,
        "shift_id": assignment.shift_id,
        "user_id": assignment.user_id,
        "team_id": assignment.team_id
    }

@router.delete(
    "/assignments/{assignment_id}",
    response_model=ShiftAssignmentActionResponse
)
def delete_shift_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    require_admin(
        current_user
    )

    assignment = get_assignment_or_404(
        db,
        assignment_id
    )

    assignment_data = {
        "assignment_id": assignment.id,
        "shift_id": assignment.shift_id,
        "user_id": assignment.user_id,
        "team_id": assignment.team_id
    }

    add_system_log(
        db=db,
        user_id=current_user.id,
        action="SHIFT_ASSIGNMENT_DELETED",
        description=(
            f"{assignment.id} numaralı vardiya "
            "ataması silindi."
        )
    )

    db.delete(
        assignment
    )

    db.commit()

    return {
        "message": "Vardiya ataması silindi.",
        **assignment_data
    }


# =========================
# SHIFT CRUD
# =========================


@router.get(
    "/",
    response_model=list[ShiftResponse]
)
def list_shifts(
    active_only: bool = Query(
        default=False
    ),
    workplace_id: int | None = Query(
        default=None
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    query = (
        db.query(Shift)
        .options(
            joinedload(
                Shift.workplace
            )
        )
    )

    if active_only:

        query = query.filter(
            Shift.is_active.is_(True)
        )

    if workplace_id is not None:

        query = query.filter(
            Shift.workplace_id
            == workplace_id
        )

    shifts = (
        query
        .order_by(
            Shift.start_time.asc(),
            Shift.name.asc()
        )
        .all()
    )

    return [
        shift_to_response(
            shift
        )
        for shift in shifts
    ]


@router.post(
    "/",
    response_model=ShiftActionResponse,
    status_code=status.HTTP_201_CREATED
)
def create_shift(
    data: ShiftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    require_admin(
        current_user
    )

    shift_name = data.name.strip()

    validate_shift_name(
        db,
        shift_name
    )

    validate_workplace(
        db,
        data.workplace_id
    )

    shift = Shift(
        name=shift_name,
        description=data.description,
        start_time=data.start_time,
        end_time=data.end_time,
        break_minutes=data.break_minutes,
        late_tolerance_minutes=(
            data.late_tolerance_minutes
        ),
        early_check_in_minutes=(
            data.early_check_in_minutes
        ),
        overtime_tolerance_minutes=(
            data.overtime_tolerance_minutes
        ),
        workplace_id=data.workplace_id,
        is_active=data.is_active
    )

    db.add(
        shift
    )

    add_system_log(
        db=db,
        user_id=current_user.id,
        action="SHIFT_CREATED",
        description=(
            f"{shift_name} vardiyası oluşturuldu."
        )
    )

    db.commit()
    db.refresh(
        shift
    )

    return {
        "message": "Vardiya başarıyla oluşturuldu.",
        "shift_id": shift.id
    }


@router.get(
    "/{shift_id}",
    response_model=ShiftDetailResponse
)
def get_shift(
    shift_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    shift = get_shift_or_404(
        db,
        shift_id
    )

    return shift_detail_to_response(
        shift
    )


@router.put(
    "/{shift_id}",
    response_model=ShiftActionResponse
)
def update_shift(
    shift_id: int,
    data: ShiftUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    require_admin(
        current_user
    )

    shift = get_shift_or_404(
        db,
        shift_id
    )

    update_data = data.model_dump(
        exclude_unset=True
    )

    if "name" in update_data:

        shift_name = (
            update_data["name"].strip()
        )

        validate_shift_name(
            db,
            shift_name,
            exclude_shift_id=shift.id
        )

        shift.name = shift_name

    if "workplace_id" in update_data:

        validate_workplace(
            db,
            update_data["workplace_id"]
        )

    editable_fields = [
        "description",
        "start_time",
        "end_time",
        "break_minutes",
        "late_tolerance_minutes",
        "early_check_in_minutes",
        "overtime_tolerance_minutes",
        "workplace_id",
        "is_active"
    ]

    for field in editable_fields:

        if field in update_data:

            setattr(
                shift,
                field,
                update_data[field]
            )

    add_system_log(
        db=db,
        user_id=current_user.id,
        action="SHIFT_UPDATED",
        description=(
            f"{shift.name} vardiyası güncellendi."
        )
    )

    db.commit()
    db.refresh(
        shift
    )

    return {
        "message": "Vardiya başarıyla güncellendi.",
        "shift_id": shift.id
    }


@router.delete(
    "/{shift_id}",
    response_model=ShiftActionResponse
)
def delete_shift(
    shift_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    require_admin(
        current_user
    )

    shift = get_shift_or_404(
        db,
        shift_id
    )

    shift_name = shift.name

    add_system_log(
        db=db,
        user_id=current_user.id,
        action="SHIFT_DELETED",
        description=(
            f"{shift_name} vardiyası silindi."
        )
    )

    db.delete(
        shift
    )

    db.commit()

    return {
        "message": "Vardiya başarıyla silindi.",
        "shift_id": shift_id
    }