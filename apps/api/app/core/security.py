from datetime import datetime, timedelta, timezone
from pathlib import Path
import os

import jwt
from dotenv import load_dotenv
from pwdlib import PasswordHash

API_DIR = Path(__file__).resolve().parents[2]
load_dotenv(API_DIR / ".env")

password_hash = PasswordHash.recommended()

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is missing from apps/api/.env")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10080

def hash_password(password: str) -> str:
    return password_hash.hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)

def create_access_token(subject: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": subject, "exp": expires}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

