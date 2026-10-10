
from fastapi import APIRouter

from app.routes.reports import reports_db


router = APIRouter(
    prefix="/api/departments",
    tags=["Departments"]
)


# ---------------------------------------------------------
# Helper functions
# ---------------------------------------------------------

def get_text_value(value, *possible_keys):
    """
    Safely convert a string or dictionary field into text.
    Supports nested fields used by incident intelligence.
    """
    if isinstance(value, dict):
        for key in possible_keys:
            nested_value = value.get(key)

            if nested_value is not None:
                if isinstance(nested_value, (str, int, float)):
                    return str(nested_value).strip().lower()

                if isinstance(nested_value, dict):
                    result = get_text_value(
                        nested_value,
                        "level",
                        "severity",
                        "label",
                        "name",
                        "value",
                        "status",
                    )
                    if result:
                        return result

        return ""

    if value is None:
        return ""

    return str(value).strip().lower()


def get_department_code(report):
    """
    Read department code safely from an incident.
    """
    code = report.get("department_code", "")

    if isinstance(code, dict):
        code = (
            code.get("code")
            or code.get("department_code")
            or code.get("value")
            or ""
        )

    return str(code).strip().upper()


def get_report_status(report):
    """
    Support both string and dictionary status formats.
    """
    return get_text_value(
        report.get("status", ""),
        "status",
        "label",
        "name",
        "value",
    )


def get_report_severity(report):
    """
    Support string and dictionary severity formats.
    """
    return get_text_value(
        report.get("severity", ""),
        "level",
        "severity",
        "label",
        "name",
        "value",
    )


# ---------------------------------------------------------
# Department dashboard
# ---------------------------------------------------------

@router.get("/{department_code}/dashboard")
def get_department_dashboard(department_code: str):

    department_code = department_code.strip().upper()

    # -----------------------------------------------------
    # Get incidents assigned to this department
    # -----------------------------------------------------

    assigned_reports = [
        report
        for report in reports_db
        if get_department_code(report) == department_code
    ]

    # -----------------------------------------------------
    # Calculate statistics
    # -----------------------------------------------------

    total_incidents = len(assigned_reports)

    high_priority = sum(
        1
        for report in assigned_reports
        if get_report_severity(report) == "high"
    )

    new_incidents = sum(
        1
        for report in assigned_reports
        if get_report_status(report) == "reported"
    )

    active_incidents = sum(
        1
        for report in assigned_reports
        if get_report_status(report)
        in ["assigned", "in progress", "working"]
    )

    resolved_incidents = sum(
        1
        for report in assigned_reports
        if get_report_status(report)
        in ["resolved", "completed", "work completed"]
    )

    # -----------------------------------------------------
    # Return dashboard
    # -----------------------------------------------------

    return {
        "success": True,

        "department_code": department_code,

        "statistics": {
            "total_incidents": total_incidents,
            "high_priority": high_priority,
            "new_incidents": new_incidents,
            "active_incidents": active_incidents,
            "resolved_incidents": resolved_incidents,
        },

        "incidents": assigned_reports,
    }