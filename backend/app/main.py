"""
RADIX Talent Match — FastAPI Backend Entry Point
Role 1: JD Analytics Agent
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.jd_routes import router as jd_router
from app.routes.resume_routes import router as resume_router
from app.routes.talent_routes import router as talent_router
from app.routes.profile_routes import router as profile_router

app = FastAPI(
    title="RADIX Talent Match API",
    description="AI-powered Job Description analyzer and Resume parser mapping skills to 12 RADIX categories",
    version="1.0.0",
)

# CORS — allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(jd_router)
app.include_router(resume_router)
app.include_router(talent_router)
app.include_router(profile_router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "RADIX Talent Match API",
        "version": "1.0.0",
        "role": "Role 1 - JD Analytics Agent",
    }


@app.get("/health")
async def health():
    """Detailed health check."""
    return {"status": "ok"}
