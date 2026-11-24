from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.auth import get_db
from app.api.users import get_current_user
from app.models import User
from app.scan_history_models import ScanHistory

router = APIRouter(prefix="/scanner/history", tags=["Scan History"])


class ScanHistoryCreate(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    language: str = Field(min_length=1, max_length=100)
    extracted_text: str = Field(min_length=1)
    translated_text: str | None = None
    word_count: int = Field(ge=0)


class ScanHistoryResponse(BaseModel):
    id: int
    filename: str
    language: str
    extracted_text: str
    translated_text: str | None
    word_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


@router.post("/", response_model=ScanHistoryResponse, status_code=status.HTTP_201_CREATED)
def save_scan(
    request: ScanHistoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scan = ScanHistory(
        user_id=current_user.id,
        filename=request.filename,
        language=request.language,
        extracted_text=request.extracted_text,
        translated_text=request.translated_text,
        word_count=request.word_count,
    )

    db.add(scan)
    db.commit()
    db.refresh(scan)

    return scan


@router.get("/", response_model=list[ScanHistoryResponse])
def get_scan_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(ScanHistory)
        .filter(ScanHistory.user_id == current_user.id)
        .order_by(ScanHistory.created_at.desc())
        .all()
    )


@router.delete("/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scan = (
        db.query(ScanHistory)
        .filter(
            ScanHistory.id == scan_id,
            ScanHistory.user_id == current_user.id,
        )
        .first()
    )

    if not scan:
        raise HTTPException(status_code=404, detail="Scan history record not found.")

    db.delete(scan)
    db.commit()

class ScanTranslationUpdate(BaseModel):
    translated_text: str = Field(min_length=1)


@router.patch("/{scan_id}", response_model=ScanHistoryResponse)
def update_scan_translation(
    scan_id: int,
    request: ScanTranslationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scan = (
        db.query(ScanHistory)
        .filter(
            ScanHistory.id == scan_id,
            ScanHistory.user_id == current_user.id,
        )
        .first()
    )

    if not scan:
        raise HTTPException(status_code=404, detail="Scan history record not found.")

    scan.translated_text = request.translated_text
    db.commit()
    db.refresh(scan)

    return scan
