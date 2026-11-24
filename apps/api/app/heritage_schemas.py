from pydantic import BaseModel, ConfigDict, Field

class HeritageSiteCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    description: str
    category: str = Field(min_length=2, max_length=100)
    location: str
    state: str
    country: str = "India"
    latitude: float | None = None
    longitude: float | None = None
    historical_period: str | None = None
    image_url: str | None = None

class HeritageSiteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    category: str
    location: str
    state: str
    country: str
    latitude: float | None
    longitude: float | None
    historical_period: str | None
    image_url: str | None

class HeritageArtifactCreate(BaseModel):
    site_id: int | None = None
    name: str
    description: str
    artifact_type: str
    historical_period: str | None = None
    image_url: str | None = None

class InscriptionCreate(BaseModel):
    site_id: int | None = None
    title: str
    original_text: str | None = None
    translated_text: str | None = None
    language: str | None = None
    historical_period: str | None = None
    image_url: str | None = None

class HeritageArtifactResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    site_id: int | None
    name: str
    description: str
    artifact_type: str
    historical_period: str | None
    image_url: str | None


class InscriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    site_id: int | None
    title: str
    original_text: str | None
    translated_text: str | None
    language: str | None
    historical_period: str | None
    image_url: str | None
