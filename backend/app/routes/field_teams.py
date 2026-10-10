
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.routes.reports import reports_db

router = APIRouter(
    prefix="/api/field-teams",
    tags=["Field Teams"],
)

FIELD_TEAMS = {
    "ROAD-TEAM-01": {
        "code": "ROAD-TEAM-01",
        "name": "Road Repair Team 01",
        "department_code": "ROAD",
        "department": "Roads & Infrastructure Department",
    },
    "ROAD-TEAM-02": {
        "code": "ROAD-TEAM-02",
        "name": "Road Repair Team 02",
        "department_code": "ROAD",
        "department": "Roads & Infrastructure Department",
    },
    "WASTE-TEAM-01": {
        "code": "WASTE-TEAM-01",
        "name": "Waste Response Team 01",
        "department_code": "WASTE",
        "department": "Waste Management Department",
    },
    "WATER-TEAM-01": {
        "code": "WATER-TEAM-01",
        "name": "Water Maintenance Team 01",
        "department_code": "WATER",
        "department": "Water Supply Department",
    },
        "ELEC-TEAM-01": {
        "code": "ELEC-TEAM-01",
        "name": "Street Lighting Maintenance Team 01",
        "department_code": "ELEC",
        "department": "Electrical & Street Lighting Department",
    },
}


def now():
    return datetime.now(timezone.utc).isoformat()


def find_incident(incident_id):
    for report in reports_db:
        if report.get("incident_id") == incident_id:
            return report

    raise HTTPException(
        status_code=404,
        detail="Incident not found. Create a new report and use its returned incident ID.",
    )


class Assignment(BaseModel):
    incident_id: str
    field_team_code: str


class WorkUpdate(BaseModel):
    status: str
    progress: int = Field(default=0, ge=0, le=100)
    note: str = Field(default="", max_length=1000)


@router.get("/")
def list_teams():
    return {
        "success": True,
        "field_teams": list(FIELD_TEAMS.values()),
    }


@router.post("/assign")
def assign_team(data: Assignment):
    incident = find_incident(data.incident_id)
    team = FIELD_TEAMS.get(data.field_team_code.strip().upper())

    if not team:
        raise HTTPException(
            status_code=404,
            detail="Field team not found.",
        )

    routing = incident.get("routing") or {}

    incident_department_code = str(
        incident.get("department_code")
        or routing.get("department_code")
        or ""
    ).strip().upper()

    if not incident_department_code:
        category = str(incident.get("category", "")).strip().lower()

        category_codes = {
            "road": "ROAD",
            "streetlight": "ELEC",
            "waste": "WASTE",
            "drainage": "DRAIN",
            "water": "WATER",
            "public-transport": "TRANSIT",
            "ev-charging": "EV",
        }

        incident_department_code = category_codes.get(category, "GENERAL")

    if incident_department_code != team["department_code"]:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "The selected team does not match the incident department.",
                "incident_department_code": incident_department_code,
                "team_department_code": team["department_code"],
                "hint": "Create a correctly routed report or choose a team for its department.",
            },
        )

    incident.update({
        "department": team["department"],
        "department_code": team["department_code"],
        "field_team_code": team["code"],
        "field_team_name": team["name"],
        "assignment_status": "Assigned",
        "work_status": "Assigned",
        "status": "Assigned",
        "assigned_at": now(),
        "progress": 0,
    })

    incident.setdefault("work_updates", []).append({
        "status": "Assigned",
        "progress": 0,
        "note": f"Job assigned to {team['name']}.",
        "timestamp": now(),
    })

    return {
        "success": True,
        "message": "Field team assigned successfully.",
        "incident": incident,
    }


@router.get("/{team_code}/dashboard")
def team_dashboard(team_code: str):
    team = FIELD_TEAMS.get(team_code.strip().upper())

    if not team:
        raise HTTPException(status_code=404, detail="Field team not found.")

    jobs = [
        report
        for report in reports_db
        if report.get("field_team_code") == team["code"]
    ]

    return {
        "success": True,
        "team": team,
        "statistics": {
            "total_jobs": len(jobs),
            "assigned_jobs": sum(
                job.get("work_status") == "Assigned" for job in jobs
            ),
            "accepted_jobs": sum(
                job.get("work_status") == "Accepted" for job in jobs
            ),
            "active_jobs": sum(
                job.get("work_status") == "In Progress" for job in jobs
            ),
            "completed_jobs": sum(
                job.get("work_status") == "Completed" for job in jobs
            ),
        },
        "jobs": jobs,
    }


@router.patch("/jobs/{incident_id}/status")
def update_job(incident_id: str, data: WorkUpdate):
    incident = find_incident(incident_id)

    if not incident.get("field_team_code"):
        raise HTTPException(
            status_code=400,
            detail="Assign a field team before updating work status.",
        )

    allowed_statuses = {
        "accepted": "Accepted",
        "in progress": "In Progress",
        "completed": "Completed",
    }

    status = allowed_statuses.get(data.status.strip().lower())

    if not status:
        raise HTTPException(
            status_code=400,
            detail="Status must be Accepted, In Progress, or Completed.",
        )

    if status == "Accepted":
        progress = 0
        incident["accepted_at"] = now()
    elif status == "In Progress":
        progress = min(data.progress, 99)
        incident["started_at"] = incident.get("started_at") or now()
    else:
        progress = 100
        incident["completed_at"] = now()

    incident["work_status"] = status
    incident["assignment_status"] = (
        "Completed" if status == "Completed"
        else "Working" if status == "In Progress"
        else "Accepted"
    )
    incident["status"] = (
        "Work Completed" if status == "Completed"
        else "In Progress" if status == "In Progress"
        else "Assigned"
    )
    incident["progress"] = progress

    incident.setdefault("work_updates", []).append({
        "status": status,
        "progress": progress,
        "note": data.note,
        "timestamp": now(),
    })

    return {
        "success": True,
        "message": f"Work status updated to {status}.",
        "incident": incident,
    }