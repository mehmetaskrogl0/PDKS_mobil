from datetime import datetime, timedelta

from jose import JWTError, jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session

from passlib.context import CryptContext

from .database import get_db
from .models import User


# =========================
# JWT AYARLARI
# =========================

SECRET_KEY = "pdks_secret_key_123"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


oauth2_scheme = HTTPBearer()



# =========================
# PASSWORD HASH
# =========================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str):

    return pwd_context.hash(password)



def verify_password(
    plain_password: str,
    hashed_password: str
):

    return pwd_context.verify(
        plain_password,
        hashed_password
    )



# =========================
# TOKEN OLUŞTURMA
# =========================

def create_access_token(data: dict):

    to_encode = data.copy()


    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )


    to_encode.update({
        "exp": expire
    })


    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


    return encoded_jwt





# =========================
# CURRENT USER BULMA
# =========================

def get_current_user(
    credentials = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):


    credentials_exception = HTTPException(

        status_code=401,

        detail="Geçersiz token",

        headers={
            "WWW-Authenticate": "Bearer"
        }

    )


    try:

        payload = jwt.decode(

            credentials.credentials,

            SECRET_KEY,

            algorithms=[ALGORITHM]

        )


        email = payload.get("sub")


        if email is None:

            raise credentials_exception



    except JWTError:

        raise credentials_exception




    user = db.query(User).filter(

        User.email == email

    ).first()



    if user is None:

        raise credentials_exception



    return user





# =========================
# ADMIN KONTROLÜ
# =========================

def admin_required(

    current_user: User = Depends(get_current_user)

):


    if current_user.role != "admin":

        raise HTTPException(

            status_code=403,

            detail="Bu işlem için admin yetkisi gerekli"

        )


    return current_user