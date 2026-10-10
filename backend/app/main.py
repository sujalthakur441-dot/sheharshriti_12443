
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.reports import router as reports_router
from app.routes.departments import router as departments_router
from app.routes.field_teams import router as field_teams_router
from app.routes.evidence import router as evidence_router
from app.routes.feedback import router as feedback_router
from app.routes.oversight import router as oversight_router


# =========================================================
# SheharShriti FastAPI Application
# =========================================================

app = FastAPI(
    title="SheharShriti Civic Intelligence API",
    description=(
        "AI-powered civic intelligence and public "
        "infrastructure accountability platform."
    ),
    version="1.0.0",
)


# =========================================================
# CORS Configuration
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# API Routers
# =========================================================

# Citizen reports, incident intelligence, and AI routing
app.include_router(reports_router)

# Department dashboard
app.include_router(departments_router)

# Field-team assignments and work lifecycle
app.include_router(field_teams_router)

# Work evidence uploads and verification
app.include_router(evidence_router)

# Work feedback review
app.include_router(feedback_router)

# Work oversight
app.include_router(oversight_router)


# =========================================================
# Root API
# =========================================================

@app.get("/")
def root():
    return {
        "message": "SheharShriti API is running",
        "status": "online",
        "version": "1.0.0",
    }