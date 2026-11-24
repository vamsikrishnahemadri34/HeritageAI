from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class HeritageSite(Base):
    __tablename__ = "heritage_sites"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    country: Mapped[str] = mapped_column(String(100), default="India", nullable=False)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    historical_period: Mapped[str | None] = mapped_column(String(150), nullable=True)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

class HeritageArtifact(Base):
    __tablename__ = "heritage_artifacts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    site_id: Mapped[int | None] = mapped_column(
        ForeignKey("heritage_sites.id", ondelete="SET NULL"),
        nullable=True,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    artifact_type: Mapped[str] = mapped_column(String(100), nullable=False)
    historical_period: Mapped[str | None] = mapped_column(String(150), nullable=True)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

class Inscription(Base):
    __tablename__ = "inscriptions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    site_id: Mapped[int | None] = mapped_column(
        ForeignKey("heritage_sites.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    original_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    translated_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    language: Mapped[str | None] = mapped_column(String(100), nullable=True)
    historical_period: Mapped[str | None] = mapped_column(String(150), nullable=True)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
