
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.routes.reports import reports_db
from app.routes.evidence import evidence_db
from app.routes.feedback import feedback_db

router = APIRouter(
    prefix="/api/oversight",
    tags=["Central Governance & Oversight"],
)

# Prototype-only storage. Actions are not retained after a restart.
oversight_actions = []


def now():
    return datetime.now(timezone.utc).isoformat()


def incident_id_of(incident):
    return str(incident.get("incident_id", ""))


def incident_work_status(incident):
    return str(
        incident.get("work_status")
        or incident.get("status")
        or "Reported"
    )


def department_of(incident):
    routing = incident.get("routing") or {}
    return (
        incident.get("department")
        or routing.get("department")
        or "Unassigned"
    )


def incident_evidence(incident_id):
    return [
        item for item in evidence_db
        if item.get("incident_id") == incident_id
    ]


def incident_feedback(incident_id):
    return [
        item for item in feedback_db
        if item.get("incident_id") == incident_id
    ]


def incident_alerts(incident):
    incident_id = incident_id_of(incident)
    alerts = []

    evidence = incident_evidence(incident_id)
    feedback = incident_feedback(incident_id)
    work_status = incident_work_status(incident).lower()

    if work_status in {"completed", "work completed"} and not evidence:
        alerts.append("Completed work has no submitted evidence")

    if any(
        item.get("verification_status") == "Pending Review"
        for item in evidence
    ):
        alerts.append("Evidence is awaiting review")

    if any(
        item.get("verification_status") == "Rejected"
        for item in evidence
    ):
        alerts.append("One or more evidence records were rejected")

    if any(
        item.get("outcome") == "Disputed"
        and item.get("status") == "Awaiting Department Review"
        for item in feedback
    ):
        alerts.append("Citizen dispute awaits department review")

    if (
        work_status == "reopened"
        or incident.get("status") == "Reopened"
    ):
        alerts.append("Incident has been reopened")

    return alerts


def incident_summary(incident):
    incident_id = incident_id_of(incident)
    evidence = incident_evidence(incident_id)
    feedback = incident_feedback(incident_id)

    return {
        "incident_id": incident_id,
        "title": incident.get("title", "Untitled incident"),
        "category": incident.get("category", "Unknown"),
        "location": incident.get("location", "Unknown"),
        "severity": incident.get("severity", "Unknown"),
        "department": department_of(incident),
        "status": incident.get("status", "Reported"),
        "work_status": incident_work_status(incident),
        "progress": incident.get("progress", 0),
        "evidence_count": len(evidence),
        "feedback_count": len(feedback),
        "verification_status": incident.get(
            "verification_status",
            "Not Yet Submitted",
        ),
        "alerts": incident_alerts(incident),
        "created_at": incident.get("created_at"),
    }


class OversightActionRequest(BaseModel):
    action_type: str
    actor: str = Field(min_length=2, max_length=100)
    note: str = Field(min_length=5, max_length=2000)


@router.get("/dashboard")
def oversight_dashboard():
    summaries = [
        incident_summary(incident)
        for incident in reports_db
    ]

    department_counts = {}
    for item in summaries:
        department = item["department"]
        department_counts[department] = (
            department_counts.get(department, 0) + 1
        )

    return {
        "success": True,
        "generated_at": now(),
        "statistics": {
            "total_incidents": len(summaries),
            "completed_incidents": sum(
                item["work_status"].lower()
                in {"completed", "work completed"}
                for item in summaries
            ),
            "in_progress_incidents": sum(
                item["work_status"].lower() == "in progress"
                for item in summaries
            ),
            "reopened_incidents": sum(
                item["work_status"].lower() == "reopened"
                or item["status"] == "Reopened"
                for item in summaries
            ),
            "incidents_with_alerts": sum(
                bool(item["alerts"]) for item in summaries
            ),
            "pending_disputes": sum(
                "Citizen dispute awaits department review"
                in item["alerts"]
                for item in summaries
            ),
            "pending_evidence_reviews": sum(
                "Evidence is awaiting review" in item["alerts"]
                for item in summaries
            ),
            "completed_without_evidence": sum(
                "Completed work has no submitted evidence"
                in item["alerts"]
                for item in summaries
            ),
        },
        "department_counts": department_counts,
        "recent_incidents": summaries[-10:][::-1],
    }


@router.get("/incidents")
def list_oversight_incidents(
    status: str | None = Query(default=None),
    department: str | None = Query(default=None),
    alerts_only: bool = Query(default=False),
):
    results = [
        incident_summary(incident)
        for incident in reports_db
    ]

    if status:
        results = [
            item for item in results
            if item["work_status"].lower() == status.strip().lower()
            or item["status"].lower() == status.strip().lower()
        ]

    if department:
        results = [
            item for item in results
            if item["department"].lower()
            == department.strip().lower()
        ]

    if alerts_only:
        results = [
            item for item in results if item["alerts"]
        ]

    return {
        "success": True,
        "total": len(results),
        "incidents": results[::-1],
    }


@router.get("/incidents/{incident_id}")
def oversight_incident_detail(incident_id: str):
    incident = next(
        (
            item for item in reports_db
            if incident_id_of(item) == incident_id
        ),
        None,
    )

    if incident is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found.",
        )

    return {
        "success": True,
        "incident": incident_summary(incident),
        "work_updates": incident.get("work_updates", []),
        "evidence": incident_evidence(incident_id),
        "feedback": incident_feedback(incident_id),
        "oversight_actions": [
            item for item in oversight_actions
            if item["incident_id"] == incident_id
        ],
    }


@router.post("/incidents/{incident_id}/actions")
def create_oversight_action(
    incident_id: str,
    data: OversightActionRequest,
):
    incident = next(
        (
            item for item in reports_db
            if incident_id_of(item) == incident_id
        ),
        None,
    )

    if incident is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found.",
        )

    allowed_actions = {
        "Request Inspection",
        "Request Rework",
        "Escalate",
        "Request Documentation",
        "Monitor",
    }

    normalized_action = data.action_type.strip().lower()
    action_type = next(
        (
            action for action in allowed_actions
            if action.lower() == normalized_action
        ),
        None,
    )

    if action_type is None:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Unsupported oversight action.",
                "allowed_actions": sorted(allowed_actions),
            },
        )

    action = {
        "action_id": f"OVS-{len(oversight_actions) + 1:06d}",
        "incident_id": incident_id,
        "action_type": action_type,
        "actor": data.actor.strip(),
        "note": data.note.strip(),
        "created_at": now(),
        "status": "Recorded",
    }

    oversight_actions.append(action)

    incident.setdefault("work_updates", []).append({
        "status": f"Oversight Action: {action_type}",
        "progress": incident.get("progress", 0),
        "note": data.note.strip(),
        "timestamp": action["created_at"],
    })

    return {
        "success": True,
        "message": "Oversight action recorded.",
        "action": action,
    }