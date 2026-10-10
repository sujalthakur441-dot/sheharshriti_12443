from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime

from app.services.incident_intelligence import analyze_report
from app.services.routing import route_incident


router = APIRouter(
    prefix="/api/reports",
    tags=["Citizen Reports"]
)


# ---------------------------------------------------------
# Temporary in-memory database
# ---------------------------------------------------------

reports_db = []


# ---------------------------------------------------------
# Request model
# ---------------------------------------------------------

class ReportCreate(BaseModel):

    category: str = Field(
        ...,
        min_length=2,
        max_length=100
    )

    title: str = Field(
        ...,
        min_length=3,
        max_length=200
    )

    description: str = Field(
        ...,
        min_length=5,
        max_length=3000
    )

    location: str = Field(
        ...,
        min_length=2,
        max_length=300
    )

    severity: str = Field(
        default="Medium"
    )


# ---------------------------------------------------------
# Create report
# ---------------------------------------------------------

@router.post("/")
def create_report(report: ReportCreate):

    # -----------------------------------------------------
    # Generate incident ID
    # -----------------------------------------------------

    incident_number = len(reports_db) + 1

    incident_id = f"SHR-2026-{incident_number:06d}"


    # -----------------------------------------------------
    # Create initial report
    # -----------------------------------------------------

    new_report = {
        "incident_id": incident_id,
        "category": report.category,
        "title": report.title,
        "description": report.description,
        "location": report.location,
        "severity": report.severity,
        "status": "Reported",
        "created_at": datetime.utcnow().isoformat(),
    }


    # -----------------------------------------------------
    # STEP 7
    # Incident Intelligence
    # -----------------------------------------------------

    ai_result = analyze_report(
        report=new_report,
        existing_reports=reports_db
    )


    # Update AI classification
    new_report["category"] = ai_result["category"]
    new_report["severity"] = ai_result["severity"]

    new_report["ai_status"] = "Analysis Complete"

    new_report["ai_analysis"] = ai_result


    # -----------------------------------------------------
    # STEP 8
    # Department Routing
    # -----------------------------------------------------

    routing_result = route_incident(
        new_report
    )


    # Attach routing information
    new_report["routing"] = routing_result

    new_report["department"] = routing_result["department"]

    new_report["department_code"] = routing_result[
        "department_code"
    ]

    new_report["routing_status"] = routing_result[
        "routing_status"
    ]


    # -----------------------------------------------------
    # Store report
    # -----------------------------------------------------

    reports_db.append(new_report)


    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {
        "success": True,
        "message": "Report submitted, analyzed and routed successfully.",

        "incident": new_report
    }


# ---------------------------------------------------------
# Get all reports
# ---------------------------------------------------------

@router.get("/")
def get_reports():

    return {
        "success": True,
        "count": len(reports_db),
        "reports": reports_db
    }


# ---------------------------------------------------------
# Get single incident
# ---------------------------------------------------------

@router.get("/{incident_id}")
def get_report(incident_id: str):

    for report in reports_db:

        if report["incident_id"] == incident_id:

            return {
                "success": True,
                "incident": report
            }

    raise HTTPException(
        status_code=404,
        detail="Incident not found"
    )