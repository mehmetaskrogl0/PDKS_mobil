from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import (
    Team,
    User,
    Workplace,
    Attendance,
    Leave
)
from ..schemas import (
    TeamCreate,
    TeamUpdate,
    TeamResponse,
    TeamDetailResponse,
    TeamActionResponse,
    TeamMemberAssign,
    TeamMemberUpdate,
    TeamLeaderAssign,
    TeamAttendanceSummaryResponse
)
from ..security import admin_required


router = APIRouter(
    prefix="/teams",
    tags=["Teams"]
)


# =========================
# YARDIMCI FONKSİYONLAR
# =========================


def get_team_or_404(
    team_id: int,
    db: Session
):

    team = db.query(Team).filter(
        Team.id == team_id
    ).first()

    if not team:

        raise HTTPException(
            status_code=404,
            detail="Ekip bulunamadı."
        )

    return team



def get_user_or_404(
    user_id: int,
    db: Session
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:

        raise HTTPException(
            status_code=404,
            detail="Kullanıcı bulunamadı."
        )

    return user



def get_workplace_or_404(
    workplace_id: int,
    db: Session
):

    workplace = db.query(Workplace).filter(
        Workplace.id == workplace_id
    ).first()

    if not workplace:

        raise HTTPException(
            status_code=404,
            detail="İş yeri bulunamadı."
        )

    return workplace



# =========================
# EKİP OLUŞTUR
# =========================


@router.post(
    "/",
    response_model=TeamResponse
)
def create_team(

    data: TeamCreate,

    db: Session = Depends(get_db),

    admin: User = Depends(admin_required)

):

    existing_team = db.query(Team).filter(

        func.lower(Team.name)
        ==
        data.name.strip().lower()

    ).first()

    if existing_team:

        raise HTTPException(
            status_code=400,
            detail="Bu isimde bir ekip zaten var."
        )


    leader = None

    if data.leader_id is not None:

        leader = get_user_or_404(
            data.leader_id,
            db
        )


    workplace = None

    if data.workplace_id is not None:

        workplace = get_workplace_or_404(
            data.workplace_id,
            db
        )


    team = Team(

        name=data.name.strip(),

        description=(
            data.description.strip()
            if data.description
            else None
        ),

        leader_id=(
            leader.id
            if leader
            else None
        ),

        workplace_id=(
            workplace.id
            if workplace
            else None
        )

    )


    db.add(team)
    db.commit()
    db.refresh(team)


    if leader:

        leader.team_id = team.id

        db.commit()
        db.refresh(leader)


    db.refresh(team)

    return team



# =========================
# TÜM EKİPLER
# =========================


@router.get(
    "/",
    response_model=list[TeamResponse]
)
def get_teams(

    db: Session = Depends(get_db),

    admin: User = Depends(admin_required)

):

    teams = db.query(Team).order_by(
        Team.name.asc()
    ).all()

    return teams



# =========================
# EKİP DETAYI
# =========================


@router.get(
    "/{team_id}",
    response_model=TeamDetailResponse
)
def get_team_detail(

    team_id: int,

    db: Session = Depends(get_db),

    admin: User = Depends(admin_required)

):

    team = get_team_or_404(
        team_id,
        db
    )

    return team



# =========================
# EKİP GÜNCELLE
# =========================


@router.put(
    "/{team_id}",
    response_model=TeamResponse
)
def update_team(

    team_id: int,

    data: TeamUpdate,

    db: Session = Depends(get_db),

    admin: User = Depends(admin_required)

):

    team = get_team_or_404(
        team_id,
        db
    )


    update_data = data.model_dump(
        exclude_unset=True
    )


    if "name" in update_data:

        new_name = update_data["name"].strip()

        existing_team = db.query(Team).filter(

            func.lower(Team.name)
            ==
            new_name.lower(),

            Team.id != team_id

        ).first()

        if existing_team:

            raise HTTPException(
                status_code=400,
                detail="Bu isimde başka bir ekip zaten var."
            )

        team.name = new_name


    if "description" in update_data:

        description = update_data["description"]

        team.description = (
            description.strip()
            if description
            else None
        )


    if "workplace_id" in update_data:

        workplace_id = update_data["workplace_id"]

        if workplace_id is None:

            team.workplace_id = None

        else:

            workplace = get_workplace_or_404(
                workplace_id,
                db
            )

            team.workplace_id = workplace.id


    if "leader_id" in update_data:

        leader_id = update_data["leader_id"]

        if leader_id is None:

            team.leader_id = None

        else:

            leader = get_user_or_404(
                leader_id,
                db
            )

            leader.team_id = team.id
            team.leader_id = leader.id


    db.commit()
    db.refresh(team)

    return team



# =========================
# EKİP SİL
# =========================


@router.delete(
    "/{team_id}",
    response_model=TeamActionResponse
)
def delete_team(

    team_id: int,

    db: Session = Depends(get_db),

    admin: User = Depends(admin_required)

):

    team = get_team_or_404(
        team_id,
        db
    )


    members = db.query(User).filter(
        User.team_id == team.id
    ).all()


    for member in members:

        member.team_id = None
        member.job_title = None
        member.job_description = None


    db.delete(team)
    db.commit()


    return {

        "message":
            "Ekip başarıyla silindi.",

        "team_id":
            team_id

    }



# =========================
# EKİBE PERSONEL EKLE
# =========================


@router.post(
    "/{team_id}/members",
    response_model=TeamActionResponse
)
def add_team_member(

    team_id: int,

    data: TeamMemberAssign,

    db: Session = Depends(get_db),

    admin: User = Depends(admin_required)

):

    team = get_team_or_404(
        team_id,
        db
    )

    user = get_user_or_404(
        data.user_id,
        db
    )


    user.team_id = team.id

    user.job_title = (
        data.job_title.strip()
        if data.job_title
        else None
    )

    user.job_description = (
        data.job_description.strip()
        if data.job_description
        else None
    )


    db.commit()
    db.refresh(user)


    return {

        "message":
            "Personel ekibe başarıyla eklendi.",

        "team_id":
            team.id,

        "user_id":
            user.id

    }



# =========================
# EKİP ÜYESİ GÖREV GÜNCELLE
# =========================


@router.put(
    "/{team_id}/members/{user_id}",
    response_model=TeamActionResponse
)
def update_team_member(

    team_id: int,

    user_id: int,

    data: TeamMemberUpdate,

    db: Session = Depends(get_db),

    admin: User = Depends(admin_required)

):

    team = get_team_or_404(
        team_id,
        db
    )

    user = get_user_or_404(
        user_id,
        db
    )


    if user.team_id != team.id:

        raise HTTPException(
            status_code=400,
            detail="Bu kullanıcı belirtilen ekibin üyesi değil."
        )


    update_data = data.model_dump(
        exclude_unset=True
    )


    if "job_title" in update_data:

        job_title = update_data["job_title"]

        user.job_title = (
            job_title.strip()
            if job_title
            else None
        )


    if "job_description" in update_data:

        job_description = update_data[
            "job_description"
        ]

        user.job_description = (
            job_description.strip()
            if job_description
            else None
        )


    db.commit()
    db.refresh(user)


    return {

        "message":
            "Personelin ekip bilgileri güncellendi.",

        "team_id":
            team.id,

        "user_id":
            user.id

    }



# =========================
# EKİPTEN PERSONEL ÇIKAR
# =========================


@router.delete(
    "/{team_id}/members/{user_id}",
    response_model=TeamActionResponse
)
def remove_team_member(

    team_id: int,

    user_id: int,

    db: Session = Depends(get_db),

    admin: User = Depends(admin_required)

):

    team = get_team_or_404(
        team_id,
        db
    )

    user = get_user_or_404(
        user_id,
        db
    )


    if user.team_id != team.id:

        raise HTTPException(
            status_code=400,
            detail="Bu kullanıcı belirtilen ekibin üyesi değil."
        )


    if team.leader_id == user.id:

        team.leader_id = None


    user.team_id = None
    user.job_title = None
    user.job_description = None


    db.commit()


    return {

        "message":
            "Personel ekipten çıkarıldı.",

        "team_id":
            team.id,

        "user_id":
            user.id

    }



# =========================
# EKİP LİDERİ ATA
# =========================


@router.put(
    "/{team_id}/leader",
    response_model=TeamActionResponse
)
def assign_team_leader(

    team_id: int,

    data: TeamLeaderAssign,

    db: Session = Depends(get_db),

    admin: User = Depends(admin_required)

):

    team = get_team_or_404(
        team_id,
        db
    )


    if data.leader_id is None:

        team.leader_id = None

        db.commit()

        return {

            "message":
                "Ekip lideri kaldırıldı.",

            "team_id":
                team.id

        }


    leader = get_user_or_404(
        data.leader_id,
        db
    )


    leader.team_id = team.id
    team.leader_id = leader.id


    db.commit()


    return {

        "message":
            "Ekip lideri başarıyla atandı.",

        "team_id":
            team.id,

        "user_id":
            leader.id

    }



# =========================
# EKİP MESAİ ÖZETİ
# =========================


@router.get(
    "/{team_id}/attendance-summary",
    response_model=TeamAttendanceSummaryResponse
)
def get_team_attendance_summary(

    team_id: int,

    db: Session = Depends(get_db),

    admin: User = Depends(admin_required)

):

    team = get_team_or_404(
        team_id,
        db
    )


    today = datetime.now().date()


    members = db.query(User).filter(
        User.team_id == team.id
    ).order_by(
        User.name.asc(),
        User.surname.asc()
    ).all()


    member_results = []

    working_count = 0
    not_working_count = 0
    on_leave_count = 0
    late_count = 0


    for member in members:

        attendance = db.query(
            Attendance
        ).filter(

            Attendance.user_id == member.id,

            func.date(
                Attendance.check_in_time
            ) == today

        ).order_by(
            Attendance.check_in_time.desc()
        ).first()


        approved_leave = db.query(
            Leave
        ).filter(

            Leave.user_id == member.id,

            Leave.status == "approved",

            Leave.start_date <= today,

            Leave.end_date >= today

        ).first()


        on_leave = approved_leave is not None


        if on_leave:

            attendance_status = "İzinli"
            on_leave_count += 1

        elif (
            attendance
            and attendance.check_out_time is None
        ):

            attendance_status = "Çalışıyor"
            working_count += 1

        else:

            attendance_status = "Çalışmıyor"
            not_working_count += 1


        if attendance and attendance.late:

            late_count += 1


        member_results.append({

            "user_id":
                member.id,

            "personel":
                f"{member.name} {member.surname}",

            "email":
                member.email,

            "job_title":
                member.job_title,

            "attendance_status":
                attendance_status,

            "check_in":
                (
                    attendance.check_in_time
                    if attendance
                    else None
                ),

            "check_out":
                (
                    attendance.check_out_time
                    if attendance
                    else None
                ),

            "late":
                (
                    attendance.late
                    if attendance
                    else False
                ),

            "late_minutes":
                (
                    attendance.late_minutes
                    if attendance
                    else 0
                ),

            "overtime_minutes":
                (
                    attendance.overtime_minutes
                    if attendance
                    else 0
                ),

            "missing_minutes":
                (
                    attendance.missing_minutes
                    if attendance
                    else 0
                ),

            "on_leave":
                on_leave

        })


    return {

        "team_id":
            team.id,

        "team_name":
            team.name,

        "leader_id":
            team.leader_id,

        "leader_name":
            team.leader_name,

        "total_members":
            len(members),

        "working_count":
            working_count,

        "not_working_count":
            not_working_count,

        "on_leave_count":
            on_leave_count,

        "late_count":
            late_count,

        "members":
            member_results

    }