from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.heritage import router as heritage_router
from app.api.scanner import router as scanner_router
from app.api.chat import router as chat_router
from app.api.scan_history import router as scan_history_router

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="HeritageAI API",
    description="AI-powered heritage discovery and preservation platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://127.0.0.1:8081",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


def register_api_routes():
    app.include_router(auth_router)
    app.include_router(users_router)
    app.include_router(heritage_router)
    app.include_router(scanner_router)
    app.include_router(chat_router)
    app.include_router(scan_history_router)


register_api_routes()


@app.get("/")
def root():
    return {"message": "Welcome to HeritageAI API", "status": "running"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "HeritageAI API"}




