from io import BytesIO
import asyncio
import logging
import os
import re

from pydantic import BaseModel, Field
from google import genai
from google.genai import types
import pytesseract
from PIL import Image, ImageOps, ImageEnhance, UnidentifiedImageError
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.auth import get_db
from app.api.users import get_current_user
from app.models import User

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/scanner", tags=["Heritage Scanner"])
MAX_IMAGE_SIZE = 10 * 1024 * 1024
GEMINI_MODEL = "gemini-3.5-flash-lite"
OCR_MODELS = {"eng": "English", "tel": "Telugu", "hin": "Devanagari"}


def preprocess_image(image: Image.Image) -> Image.Image:
    image = ImageOps.grayscale(image)
    image = ImageOps.autocontrast(image)
    image = ImageEnhance.Contrast(image).enhance(1.8)
    if image.width < 1800:
        scale = min(2.0, 1800 / max(image.width, 1))
        image = image.resize(
            (int(image.width * scale), int(image.height * scale)),
            Image.Resampling.LANCZOS,
        )
    return image


def detect_script_language(text: str) -> str:
    counts = {
        "Telugu": sum("\u0c00" <= c <= "\u0c7f" for c in text),
        "Devanagari (Hindi/Sanskrit)": sum("\u0900" <= c <= "\u097f" for c in text),
        "English": sum(c.isascii() and c.isalpha() for c in text),
    }
    language, count = max(counts.items(), key=lambda item: item[1])
    return language if count else "Unknown"


def run_tesseract_fallback(image: Image.Image) -> tuple[str, str]:
    candidates = []
    for code, name in OCR_MODELS.items():
        try:
            data = pytesseract.image_to_data(
                image, lang=code, config="--oem 1 --psm 6",
                output_type=pytesseract.Output.DICT,
            )
            text = pytesseract.image_to_string(
                image, lang=code, config="--oem 1 --psm 6"
            ).strip()
        except pytesseract.TesseractError:
            logger.exception("Tesseract failed for language %s", code)
            continue
        if not text:
            continue
        confidences = []
        for value in data.get("conf", []):
            try:
                value = float(value)
                if value >= 0:
                    confidences.append(value)
            except (TypeError, ValueError):
                pass
        average = sum(confidences) / len(confidences) if confidences else 0
        detected = detect_script_language(text)
        match = (
            (code == "tel" and detected == "Telugu")
            or (code == "hin" and detected == "Devanagari (Hindi/Sanskrit)")
            or (code == "eng" and detected == "English")
        )
        candidates.append((average + (20 if match else 0), text, name))
    if not candidates:
        return "", "Unknown"
    _, text, language = max(candidates, key=lambda item: item[0])
    detected = detect_script_language(text)
    return text, detected if detected != "Unknown" else language


def parse_gemini_transcription(response_text: str) -> tuple[str, str]:
    text = (response_text or "").strip()
    if not text:
        return "", "Unknown"
    language_match = re.search(r"DETECTED_LANGUAGE\s*:\s*(.+)", text, re.I)
    transcription_match = re.search(r"TRANSCRIPTION\s*:\s*(.*)", text, re.I | re.S)
    language = language_match.group(1).strip().splitlines()[0] if language_match else "Unknown"
    transcription = transcription_match.group(1).strip() if transcription_match else text
    transcription = re.sub(r"^\s*```(?:text)?\s*", "", transcription)
    transcription = re.sub(r"\s*```\s*$", "", transcription)
    if language.lower() in {"unknown", "not sure", "uncertain"}:
        language = detect_script_language(transcription)
    return transcription, language


@router.post("/ocr")
async def extract_inscription_text(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image.")
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")
    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail="Image must be smaller than 10 MB.")
    try:
        with Image.open(BytesIO(image_bytes)) as check:
            check.verify()
        with Image.open(BytesIO(image_bytes)) as opened:
            original = ImageOps.exif_transpose(opened).convert("RGB")
            processed = preprocess_image(original.copy())
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        raise HTTPException(status_code=400, detail="Invalid or unsupported image.")

    extracted_text, detected_language, used_method = "", "Unknown", ""
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        try:
            client = genai.Client(api_key=api_key)
            prompt = """You are a careful epigraphist. Inspect the attached photograph directly.
Transcribe every visible character in its ORIGINAL script. Do not translate,
transliterate, romanize, modernize spelling, or silently correct the text.
Preserve line breaks, punctuation, numerals and diacritics where visible.
Use [unclear] only for characters that genuinely cannot be read. Never guess
missing text from historical context. If multiple scripts occur, preserve each.
Return exactly:
DETECTED_LANGUAGE: <language or writing system; Unknown if uncertain>
TRANSCRIPTION:
<faithful transcription in the original script>"""
            response = await asyncio.to_thread(
                client.models.generate_content,
                model=GEMINI_MODEL,
                contents=[
                    prompt,
                    types.Part.from_bytes(
                        data=image_bytes,
                        mime_type=file.content_type or "image/jpeg",
                    ),
                ],
                config=types.GenerateContentConfig(
                    temperature=0.1, max_output_tokens=6000
                ),
            )
            extracted_text, detected_language = parse_gemini_transcription(response.text or "")
            if extracted_text:
                used_method = "Gemini visual transcription"
        except Exception as error:
            logger.exception(
                "Gemini visual transcription failed; using Tesseract fallback: %s",
                type(error).__name__,
            )

    if not extracted_text:
        try:
            extracted_text, detected_language = await asyncio.to_thread(
                run_tesseract_fallback, processed
            )
            if extracted_text:
                used_method = "Tesseract OCR fallback"
        except pytesseract.TesseractNotFoundError as error:
            raise HTTPException(status_code=500, detail="OCR engine is not installed.") from error
        except pytesseract.TesseractError as error:
            logger.exception("Tesseract OCR processing failed")
            raise HTTPException(
                status_code=500,
                detail="OCR processing failed. Please try another image.",
            ) from error

    return {
        "success": True,
        "filename": file.filename,
        "language": detected_language,
        "extracted_text": extracted_text,
        "word_count": len(extracted_text.split()),
        "message": (
            f"Text transcribed successfully using {used_method}. "
            "Please review uncertain characters against the photograph."
            if extracted_text
            else "No readable text found. Try a closer, sharper, well-lit image."
        ),
    }


class TranslationRequest(BaseModel):
    text: str = Field(min_length=1, max_length=12000)
    source_language: str = Field(default="Unknown", max_length=100)


class TranslationResponse(BaseModel):
    translated_text: str
    source_language: str


@router.post("/translate", response_model=TranslationResponse)
def translate_inscription(
    request: TranslationRequest,
    current_user: User = Depends(get_current_user),
):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Gemini API key is not configured.")
    prompt = f"""You are a careful scholarly translator of historical inscriptions.
SOURCE LANGUAGE / SCRIPT: {request.source_language}
SOURCE TEXT:
{request.text}

Translate all readable content into faithful, clear English. Do not transliterate
or romanize. Preserve order, line structure, dates, numbers and names. Do not
summarize, embellish, or add historical claims absent from the source. Preserve
[unclear] wherever the source marks unreadable text. Do not silently repair
uncertain text. If language or meaning is uncertain, say so briefly. Return only
the English translation, with a short uncertainty note only when necessary."""
    client = genai.Client(api_key=api_key)
    # Try the lightweight model first, then a stronger stable Flash model if
    # Google reports temporary capacity pressure or another provider failure.
    translation_models = [GEMINI_MODEL, "gemini-3.8-flash"]
    last_error = None
    for model_name in translation_models:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.1, max_output_tokens=6000
                ),
            )
            if response.text and response.text.strip():
                return TranslationResponse(
                    translated_text=response.text.strip(),
                    source_language=request.source_language,
                )
            last_error = RuntimeError(f"{model_name} returned an empty translation.")
            logger.warning("Gemini model %s returned an empty translation; trying fallback.", model_name)
        except Exception as error:
            last_error = error
            logger.warning(
                "Translation model %s failed (%s); trying fallback if available.",
                model_name,
                type(error).__name__,
            )

    logger.exception("All inscription translation models failed", exc_info=last_error)
    raise HTTPException(
        status_code=503,
        detail="Translation is temporarily unavailable. Please try again in a moment.",
    ) from last_error
