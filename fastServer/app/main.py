import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.compliance import router as compliance_router

# API Keys Configuration - Modify these as needed
os.environ.setdefault("GROQ_API_KEY", "your_groq_api_key_here")
os.environ.setdefault("HUGGINGFACE_API_KEY", "your_huggingface_api_key_here") 
os.environ.setdefault("GEMINI_API_KEY", "your_gemini_api_key_here")

app = FastAPI(
    title="Content Compliance API",
    description="Unified compliance system for text, image, video, and audio content",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(compliance_router, prefix="/compliance", tags=["compliance"])

@app.get("/")
async def root():
    return {"message": "Content Compliance API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}