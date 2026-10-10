
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.routes.reports import reports_db

router = APIRouter(
    prefix="/api/evidence",
    tags=["Work Evidence & Verification"],
)

# Evidence files are stored locally inside the backend directory.
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads" / "evidence"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB per file

ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".mp4",
}

evidence_db = []


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


def get_incident_evidence(incident_id: str):
    return [
        item for item in evidence_db
        if item["incident_id"] == incident_id
    ]


class VerificationRequest(BaseModel):
    decision: str
    reviewer: str = Field(min_length=2, max_length=100)
    note: str = Field(min_length=3, max_length=1000)


@router.post("/{incident_id}/upload")
async def upload_evidence(
    incident_id: str,
    evidence_type: str = Form(...),
    field_team_code: str = Form(...),
    note: str = Form(default="", max_length=1000),
    file: UploadFile = File(...),
):
    incident = find_incident(incident_id)

    allowed_types = {"before", "during", "after"}
    normalized_type = evidence_type.strip().lower()

    if normalized_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="evidence_type must be before, during, or after.",
        )

    assigned_team = str(
        incident.get("field_team_code") or ""
    ).strip().upper()

    submitted_team = field_team_code.strip().upper()

    if not assigned_team:
        raise HTTPException(
            status_code=400,
            detail="Assign a field team before uploading evidence.",
        )

    if submitted_team != assigned_team:
        raise HTTPException(
            status_code=403,
            detail="The submitted team does not match the assigned team.",
        )

    original_name = Path(file.filename or "").name
    extension = Path(original_name).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Use JPG, JPEG, PNG, WEBP, or MP4.",
        )

    contents = await file.read(MAX_FILE_SIZE + 1)
    await file.close()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File exceeds the 10 MB upload limit.",
        )

    evidence_id = f"EVD-{uuid.uuid4().hex[:12].upper()}"
    stored_filename = f"{evidence_id}{extension}"
    stored_path = UPLOAD_DIR / stored_filename

    stored_path.write_bytes(contents)

    record = {
        "evidence_id": evidence_id,
        "incident_id": incident_id,
        "field_team_code": assigned_team,
        "evidence_type": normalized_type.capitalize(),
        "original_filename": original_name,
        "stored_filename": stored_filename,
        "file_url": f"/api/evidence/files/{stored_filename}",
        "content_type": file.content_type or "application/octet-stream",
        "size_bytes": len(contents),
        "note": note.strip(),
        "uploaded_at": now(),
        "verification_status": "Pending Review",
        "reviewer": None,
        "review_note": None,
        "reviewed_at": None,
    }

    evidence_db.append(record)

    incident.setdefault("evidence_ids", []).append(evidence_id)
    incident["verification_status"] = "Pending Review"

    return {
        "success": True,
        "message": "Evidence uploaded and queued for review.",
        "evidence": record,
    }


@router.get("/{incident_id}")
def list_incident_evidence(incident_id: str):
    find_incident(incident_id)

    records = get_incident_evidence(incident_id)

    return {
        "success": True,
        "incident_id": incident_id,
        "total_evidence": len(records),
        "verification_status": (
            "Pending Review"
            if any(
                item["verification_status"] == "Pending Review"
                for item in records
            )
            else (
                "Verified"
                if records and all(
                    item["verification_status"] == "Verified"
                    for item in records
                )
                else (
                    "Rejected"
                    if records and all(
                        item["verification_status"] == "Rejected"
                        for item in records
                    )
                    else "Not Yet Submitted"
                )
            )
        ),
        "evidence": records,
    }


@router.get("/files/{filename}")
def view_evidence_file(filename: str):
    # Only allow a plain filename, never a user-supplied path.
    if Path(filename).name != filename:
        raise HTTPException(status_code=400, detail="Invalid filename.")

    file_path = UPLOAD_DIR / filename

    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Evidence file not found.")

    return FileResponse(file_path)


@router.patch("/{incident_id}/{evidence_id}/verify")
def verify_evidence(
    incident_id: str,
    evidence_id: str,
    data: VerificationRequest,
):
    incident = find_incident(incident_id)

    record = next(
        (
            item for item in evidence_db
            if item["incident_id"] == incident_id
            and item["evidence_id"] == evidence_id
        ),
        None,
    )

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Evidence record not found for this incident.",
        )

    decision = data.decision.strip().lower()

    if decision not in {"verified", "rejected"}:
        raise HTTPException(
            status_code=400,
            detail="Decision must be Verified or Rejected.",
        )

    record["verification_status"] = (
        "Verified" if decision == "verified" else "Rejected"
    )
    record["reviewer"] = data.reviewer.strip()
    record["review_note"] = data.note.strip()
    record["reviewed_at"] = now()

    incident_records = get_incident_evidence(incident_id)

    if any(
        item["verification_status"] == "Rejected"
        for item in incident_records
    ):
        overall_status = "Rejected"
    elif incident_records and all(
        item["verification_status"] == "Verified"
        for item in incident_records
    ):
        overall_status = "Verified"
    else:
        overall_status = "Pending Review"

    incident["verification_status"] = overall_status

    return {
        "success": True,
        "message": f"Evidence review recorded: {record['verification_status']}.",
        "incident_verification_status": overall_status,
        "evidence": record,
    }