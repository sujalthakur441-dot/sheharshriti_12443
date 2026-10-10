
"""
SheharShriti Department Routing Engine.
Explainable rule-based routing prototype.
"""

from typing import Any, Dict


DEPARTMENT_RULES = {
    "road": {
        "department": "Roads & Infrastructure Department",
        "code": "ROAD",
        "keywords": [
            "road", "pothole", "potholes", "street", "asphalt",
            "road damage", "broken road", "crater",
        ],
    },
    "streetlight": {
        "department": "Electrical & Street Lighting Department",
        "code": "ELEC",
        "keywords": [
            "streetlight", "street light", "lamp", "light pole",
            "lighting", "lights not working", "light not working",
        ],
    },
    "waste": {
        "department": "Waste Management Department",
        "code": "WASTE",
        "keywords": [
            "garbage", "waste", "trash", "dump", "dustbin",
            "rubbish", "waste collection",
        ],
    },
    "drainage": {
        "department": "Drainage & Sewerage Department",
        "code": "DRAIN",
        "keywords": [
            "drain", "drainage", "sewer", "sewage",
            "waterlogging", "flooded", "blocked drain",
        ],
    },
    "water": {
        "department": "Water Supply Department",
        "code": "WATER",
        "keywords": [
            "water", "water supply", "pipe", "pipeline",
            "leakage", "water leak", "tap",
        ],
    },
    "public-transport": {
        "department": "Public Transport Department",
        "code": "TRANSIT",
        "keywords": [
            "bus", "bus stop", "public transport",
            "transport", "bus service",
        ],
    },
    "ev-charging": {
        "department": "EV & Urban Mobility Infrastructure Department",
        "code": "EV",
        "keywords": [
            "ev", "electric vehicle", "charging",
            "charger", "charging station", "ev station",
        ],
    },
}

DEFAULT_DEPARTMENT = {
    "department": "Civic Infrastructure & General Services Department",
    "code": "GENERAL",
}


def normalize_text(value: Any) -> str:
    if isinstance(value, dict):
        value = value.get("category", "")
    if value is None:
        return ""
    return str(value).strip().lower().replace("_", "-")


def identify_category(incident: Dict[str, Any]) -> str:
    # The AI engine may provide category as a nested dictionary.
    raw_category = incident.get("category", "")
    category = normalize_text(raw_category)

    if category in DEPARTMENT_RULES:
        return category

    # Also inspect nested AI analysis when available.
    analysis = incident.get("ai_analysis") or {}
    analysis_category = normalize_text(analysis.get("category"))

    if analysis_category in DEPARTMENT_RULES:
        return analysis_category

    text = " ".join([
        normalize_text(incident.get("title")),
        normalize_text(incident.get("description")),
    ])

    # Check distinctive issue terms before broad terms.
    keyword_order = [
        ("streetlight", ["streetlight", "street light", "lamp", "light pole"]),
        ("ev-charging", ["charging station", "charger", "ev-charging"]),
        ("public-transport", ["bus stop", "public transport", "bus service"]),
        ("drainage", ["drainage", "blocked drain", "sewer", "waterlogging"]),
        ("water", ["water supply", "water leak", "pipeline", "tap"]),
        ("waste", ["garbage", "waste collection", "dustbin", "rubbish"]),
        ("road", ["pothole", "potholes", "road", "asphalt", "crater"]),
    ]

    for key, keywords in keyword_order:
        if any(keyword in text for keyword in keywords):
            return key

    return ""


def calculate_confidence(
    category: str,
    title: str,
    description: str,
) -> float:
    if category not in DEPARTMENT_RULES:
        return 0.50

    text = f"{normalize_text(title)} {normalize_text(description)}"
    keywords = DEPARTMENT_RULES[category]["keywords"]

    return 0.95 if any(keyword in text for keyword in keywords) else 0.85


def route_incident(incident: Dict[str, Any]) -> Dict[str, Any]:
    category = identify_category(incident)
    title = normalize_text(incident.get("title"))
    description = normalize_text(incident.get("description"))

    if category:
        rule = DEPARTMENT_RULES[category]
        department = rule["department"]
        department_code = rule["code"]
        confidence = calculate_confidence(category, title, description)

        return {
            "routing_status": "Routed",
            "department": department,
            "department_code": department_code,
            "confidence": confidence,
            "reason": (
                f"The issue '{title}' was classified as '{category}' "
                f"and routed to {department}. "
                f"Rule-based routing confidence: {int(confidence * 100)}%. "
                "The department should review the recommendation."
            ),
            "routing_method": "Category + Keyword Analysis",
        }

    department = DEFAULT_DEPARTMENT["department"]
    department_code = DEFAULT_DEPARTMENT["code"]

    return {
        "routing_status": "Manual Review Required",
        "department": department,
        "department_code": department_code,
        "confidence": 0.50,
        "reason": (
            "The incident could not be mapped confidently to a specialized "
            f"department. Manual review by {department} is recommended."
        ),
        "routing_method": "Fallback Routing",
    }