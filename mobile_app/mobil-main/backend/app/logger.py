from sqlalchemy.orm import Session

from .models import SystemLog



def create_log(
    db: Session,
    user_id: int | None,
    action: str,
    description: str
):

    log = SystemLog(

        user_id=user_id,

        action=action,

        description=description

    )


    db.add(log)

    db.commit()