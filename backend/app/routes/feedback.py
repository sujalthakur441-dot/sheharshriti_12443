
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.routes.reports import reports_db

router = APIRouter(
    prefix="/api/feedback",
    tags=["Citizen Feedback & Disputes"],
)

# Prototype storage. Records are cleared when the backend restarts.
feedback_db = []


def now():
    return datetime.now(timezone.utc).isoformat()


def find_incident(incident_id: str):
    for incident in reports_db:
        if incident.get("incident_id") == incident_id:
            return incident

    raise HTTPException(
        status_code=404,
        detail="Incident not found. Check the incident ID.",
    )


def find_feedback(feedback_id: str):
    for item in feedback_db:
        if item["feedback_id"] == feedback_id:
            return item

    raise HTTPException(
        status_code=404,
        detail="Feedback record not found.",
    )


class CitizenFeedback(BaseModel):
    outcome: str
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=3, max_length=2000)
    reporter_reference: str = Field(
        default="Anonymous",
        min_length=2,
        max_length=100,
    )


class DepartmentReview(BaseModel):
    decision: str
    reviewer: str = Field(min_length=2, max_length=100)
    note: str = Field(min_length=3, max_length=2000)


@router.post("/{incident_id}")
def submit_feedback(
    incident_id: str,
    data: CitizenFeedback,
):
    incident = find_incident(incident_id)

    outcome = data.outcome.strip().lower()

    if outcome not in {"satisfied", "disputed"}:
        raise HTTPException(
            status_code=400,
            detail="Outcome must be Satisfied or Disputed.",
        )

    work_status = str(
        incident.get("work_status")
        or incident.get("status")
        or ""
    ).strip().lower()

    if work_status not in {"completed", "work completed"}:
        raise HTTPException(
            status_code=409,
            detail=(
                "Citizen feedback is available after the field team "
                "marks the work completed."
            ),
        )

    # Prevent repeated submissions from creating duplicate records
    # for the same incident and reporter reference.
    reporter = data.reporter_reference.strip()

    existing = next(
        (
            item for item in feedback_db
            if item["incident_id"] == incident_id
            and item["reporter_reference"].lower() == reporter.lower()
        ),
        None,
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail=(
                "This reporter reference has already submitted feedback "
                "for this incident."
            ),
        )

    feedback_id = f"FB-{len(feedback_db) + 1:06d}"

    record = {
        "feedback_id": feedback_id,
        "incident_id": incident_id,
        "outcome": outcome.capitalize(),
        "rating": data.rating,
        "comment": data.comment.strip(),
        "reporter_reference": reporter,
        "status": (
            "Submitted"
            if outcome == "Satisfied"
            else "Awaiting Department Review"
        ),
        "created_at": now(),
        "review": None,
    }

    feedback_db.append(record)

    incident.setdefault("feedback_ids", []).append(feedback_id)
    incident["citizen_feedback_status"] = record["status"]

    if outcome == "Disputed":
        incident.setdefault("work_updates", []).append({
            "status": "Citizen Dispute Raised",
            "progress": incident.get("progress", 100),
            "note": data.comment.strip(),
            "timestamp": now(),
        })

    return {
        "success": True,
        "message": (
            "Feedback recorded successfully."
            if outcome == "Satisfied"
            else "Dispute submitted for department review."
        ),
        "feedback": record,
    }


@router.get("/{incident_id}")
def list_feedback(incident_id: str):
    find_incident(incident_id)

    records = [
        item for item in feedback_db
        if item["incident_id"] == incident_id
    ]

    return {
        "success": True,
        "incident_id": incident_id,
        "total_feedback": len(records),
        "feedback": records,
    }


@router.patch("/{incident_id}/{feedback_id}/review")
def review_feedback(
    incident_id: str,
    feedback_id: str,
    data: DepartmentReview,
):
    incident = find_incident(incident_id)
    record = find_feedback(feedback_id)

    if record["incident_id"] != incident_id:
        raise HTTPException(
            status_code=400,
            detail="Feedback does not belong to this incident.",
        )

    if record["outcome"] != "Disputed":
        raise HTTPException(
            status_code=409,
            detail="Only disputed feedback can be reviewed here.",
        )

    if record["review"] is not None:
        raise HTTPException(
            status_code=409,
            detail="This dispute has already been reviewed.",
        )

    decision = data.decision.strip().lower()

    if decision not in {"reopen", "dismiss"}:
        raise HTTPException(
            status_code=400,
            detail="Decision must be Reopen or Dismiss.",
        )

    review = {
        "decision": decision.capitalize(),
        "reviewer": data.reviewer.strip(),
        "note": data.note.strip(),
        "reviewed_at": now(),
    }

    record["review"] = review
    record["status"] = (
        "Reopened"
        if decision == "reopen"
        else "Dispute Dismissed"
    )

    incident["citizen_feedback_status"] = record["status"]

    if decision == "reopen":
        incident["work_status"] = "Reopened"
        incident["status"] = "Reopened"
        incident["assignment_status"] = "Reopened"

        # Keep the old completion timestamp as historical information.
        # Do not erase previous progress or work updates.
        incident.setdefault("work_updates", []).append({
            "status": "Reopened",
            "progress": incident.get("progress", 100),
            "note": (
                "Work reopened after department review: "
                + data.note.strip()
            ),
            "timestamp": now(),
        })
    else:
        incident.setdefault("work_updates", []).append({
            "status": "Dispute Dismissed",
            "progress": incident.get("progress", 100),
            "note": (
                "Department reviewed and dismissed the dispute: "
                + data.note.strip()
            ),
            "timestamp": now(),
        })

    return {
        "success": True,
        "message": (
            "Incident reopened for corrective action."
            if decision == "reopen"
            else "Dispute reviewed and dismissed."
        ),
        "feedback": record,
        "incident_status": incident.get("status"),
        "work_status": incident.get("work_status"),
    }