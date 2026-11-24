import os
import logging
import base64
import binascii

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, model_validator
from google import genai
from google.genai import types

from app.api.users import get_current_user
from app.models import User

router = APIRouter(prefix="/chat", tags=["AI Chat"])
logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = """
You are HeritageAI, an AI assistant specializing in world heritage,
history, archaeology, monuments, inscriptions, and cultural preservation.

Provide clear, informative and respectful answers.
Do not invent historical facts, dates, inscriptions, or sources.
If information is uncertain, clearly say so.
Help users understand and preserve cultural heritage.
"""


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(default="", max_length=4000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)
    image_base64: str | None = Field(default=None, max_length=14000000)
    image_mime_type: str | None = None

    @model_validator(mode="after")
    def validate_message_or_image(self):
        if not self.message.strip() and not self.image_base64:
            raise ValueError("Enter a message or attach an image.")
        if self.image_base64 and self.image_mime_type not in {
            "image/jpeg", "image/png", "image/webp"
        }:
            raise ValueError("Unsupported image format.")
        return self


class ChatResponse(BaseModel):
    reply: str
    model: str


@router.post("/", response_model=ChatResponse)
def send_message(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Gemini API key is not configured.",
        )

    contents = []

    for item in request.history:
        contents.append(
            types.Content(
                role="user" if item.role == "user" else "model",
                parts=[types.Part.from_text(text=item.content)],
            )
        )

    user_parts = []

    if request.message.strip():
        user_parts.append(types.Part.from_text(text=request.message))

    if request.image_base64:
        try:
            image_bytes = base64.b64decode(request.image_base64, validate=True)
        except (binascii.Error, ValueError):
            raise HTTPException(status_code=400, detail="Invalid image data.")

        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Image must be under 10 MB.")

        user_parts.append(
            types.Part.from_bytes(
                data=image_bytes,
                mime_type=request.image_mime_type,
            )
        )

    contents.append(
        types.Content(
            role="user",
            parts=user_parts,
        )
    )

    try:
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.5,
                max_output_tokens=500,
            ),
        )

        if not response.text:
            raise HTTPException(
                status_code=502,
                detail="Gemini returned an empty response.",
            )

        return ChatResponse(
            reply=response.text,
            model="gemini-3.5-flash-lite",
        )

    except HTTPException:
        raise
    except Exception as error:
        logger.exception("Gemini chat request failed: %s", type(error).__name__)
        raise HTTPException(
            status_code=502,
            detail="HeritageAI could not generate a response. Please try again.",
        )




