from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from app.api.auth import get_db
from app.api.users import get_current_user
from app.models import User
from app.heritage_models import HeritageSite, HeritageArtifact, Inscription
from app.heritage_schemas import HeritageSiteCreate, HeritageSiteResponse, HeritageArtifactCreate, HeritageArtifactResponse, InscriptionCreate, InscriptionResponse

router = APIRouter(prefix="/heritage/sites", tags=["Heritage Explorer"])

@router.post("/", response_model=HeritageSiteResponse, status_code=201)
def create_heritage_site(
    data: HeritageSiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = HeritageSite(**data.model_dump())
    db.add(site)
    db.commit()
    db.refresh(site)
    return site

@router.get("/", response_model=list[HeritageSiteResponse])
def list_heritage_sites(
    search: str | None = None,
    category: str | None = None,
    state: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = select(HeritageSite)

    if search:
        term = f"%{search}%"
        query = query.where(
            or_(
                HeritageSite.name.ilike(term),
                HeritageSite.description.ilike(term),
                HeritageSite.location.ilike(term),
            )
        )

    if category:
        query = query.where(HeritageSite.category.ilike(category))

    if state:
        query = query.where(HeritageSite.state.ilike(state))

    query = query.order_by(HeritageSite.name).offset(skip).limit(limit)
    return list(db.scalars(query).all())

@router.get("/{site_id}", response_model=HeritageSiteResponse)
def get_heritage_site(site_id: int, db: Session = Depends(get_db)):
    site = db.get(HeritageSite, site_id)

    if not site:
        raise HTTPException(status_code=404, detail="Heritage site not found")

    return site


@router.post("/artifacts/", response_model=HeritageArtifactResponse, status_code=201)
def create_artifact(
    data: HeritageArtifactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    artifact = HeritageArtifact(**data.model_dump())
    db.add(artifact)
    db.commit()
    db.refresh(artifact)
    return artifact


@router.get("/artifacts/", response_model=list[HeritageArtifactResponse])
def list_artifacts(
    site_id: int | None = None,
    db: Session = Depends(get_db)
):
    query = select(HeritageArtifact)
    if site_id is not None:
        query = query.where(HeritageArtifact.site_id == site_id)
    return list(db.scalars(query.order_by(HeritageArtifact.name)).all())


@router.post("/inscriptions/", response_model=InscriptionResponse, status_code=201)
def create_inscription(
    data: InscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inscription = Inscription(**data.model_dump())
    db.add(inscription)
    db.commit()
    db.refresh(inscription)
    return inscription


@router.get("/inscriptions/", response_model=list[InscriptionResponse])
def list_inscriptions(
    site_id: int | None = None,
    db: Session = Depends(get_db)
):
    query = select(Inscription)
    if site_id is not None:
        query = query.where(Inscription.site_id == site_id)
    return list(db.scalars(query.order_by(Inscription.title)).all())
