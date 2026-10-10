import re
from difflib import SequenceMatcher


# ============================================================
# SHEHARSHRITI INCIDENT INTELLIGENCE ENGINE
# ============================================================


CATEGORY_KEYWORDS = {

    "road": [
        "road",
        "pothole",
        "potholes",
        "street",
        "crater",
        "road damage",
        "broken road",
        "asphalt"
    ],

    "streetlight": [
        "streetlight",
        "street light",
        "lamp",
        "light pole",
        "lighting",
        "lights not working",
        "light not working"
    ],

    "waste": [
        "garbage",
        "waste",
        "trash",
        "dump",
        "dustbin",
        "rubbish",
        "waste collection"
    ],

    "drainage": [
        "drain",
        "drainage",
        "sewer",
        "sewage",
        "waterlogging",
        "flooded",
        "blocked drain"
    ],

    "water": [
        "water",
        "water supply",
        "pipe",
        "pipeline",
        "leakage",
        "water leak",
        "tap"
    ],

    "public-transport": [
        "bus",
        "bus stop",
        "public transport",
        "transport",
        "vehicle",
        "bus service"
    ],

    "ev-charging": [
        "ev",
        "electric vehicle",
        "charging",
        "charger",
        "charging station",
        "ev station"
    ]
}


SEVERITY_KEYWORDS = {

    "High": [
        "danger",
        "dangerous",
        "accident",
        "accidents",
        "injury",
        "injuries",
        "blocked",
        "major",
        "massive",
        "critical",
        "emergency",
        "unsafe",
        "risk",
        "hazard"
    ],

    "Medium": [
        "large",
        "damaged",
        "broken",
        "frequent",
        "serious",
        "problem",
        "issue"
    ],

    "Low": [
        "small",
        "minor",
        "slightly",
        "occasionally"
    ]
}


# ============================================================
# TEXT NORMALIZATION
# ============================================================

def normalize_text(text: str):

    if not text:
        return ""

    text = text.lower()

    text = re.sub(
        r"[^a-z0-9\s]",
        " ",
        text
    )

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.strip()


# ============================================================
# CATEGORY CLASSIFICATION
# ============================================================

def classify_category(
    title: str,
    description: str,
    submitted_category: str
):

    text = normalize_text(
        f"{title} {description}"
    )

    scores = {}

    for category, keywords in CATEGORY_KEYWORDS.items():

        score = 0

        for keyword in keywords:

            keyword = normalize_text(keyword)

            if keyword in text:

                score += 1

                if keyword in normalize_text(title):
                    score += 1

        scores[category] = score


    detected_category = submitted_category

    best_category = max(
        scores,
        key=scores.get
    )


    if scores[best_category] > 0:

        detected_category = best_category


    highest_score = scores.get(
        detected_category,
        0
    )


    if highest_score >= 3:

        confidence = "High"

    elif highest_score == 2:

        confidence = "Medium"

    else:

        confidence = "Low"


    return {

        "category": detected_category,

        "confidence": confidence,

        "scores": scores

    }


# ============================================================
# SEVERITY ANALYSIS
# ============================================================

def analyze_severity(
    title: str,
    description: str,
    submitted_severity: str
):

    text = normalize_text(
        f"{title} {description}"
    )

    detected_severity = submitted_severity

    matched_keywords = []


    for severity, keywords in SEVERITY_KEYWORDS.items():

        for keyword in keywords:

            keyword = normalize_text(keyword)

            if keyword in text:

                matched_keywords.append(
                    keyword
                )


    # High severity terms override
    # the citizen's selected severity.

    for keyword in SEVERITY_KEYWORDS["High"]:

        if normalize_text(keyword) in text:

            detected_severity = "High"

            break


    return {

        "severity": detected_severity,

        "matched_keywords": matched_keywords

    }


# ============================================================
# TEXT SIMILARITY
# ============================================================

def calculate_text_similarity(
    text_a: str,
    text_b: str
):

    a = normalize_text(text_a)

    b = normalize_text(text_b)


    if not a or not b:

        return 0.0


    return round(

        SequenceMatcher(
            None,
            a,
            b
        ).ratio(),

        2

    )


# ============================================================
# LOCATION SIMILARITY
# ============================================================

def calculate_location_similarity(
    location_a: str,
    location_b: str
):

    a = normalize_text(location_a)

    b = normalize_text(location_b)


    if not a or not b:

        return 0.0


    return round(

        SequenceMatcher(
            None,
            a,
            b
        ).ratio(),

        2

    )


# ============================================================
# RELATED REPORT DETECTION
# ============================================================

def find_related_reports(
    new_report,
    existing_reports
):

    related_reports = []


    new_text = (
        f"{new_report['title']} "
        f"{new_report['description']}"
    )


    for report in existing_reports:

        old_text = (
            f"{report['title']} "
            f"{report['description']}"
        )


        text_similarity = calculate_text_similarity(
            new_text,
            old_text
        )


        location_similarity = calculate_location_similarity(
            new_report["location"],
            report["location"]
        )


        same_category = (
            new_report["category"]
            ==
            report["category"]
        )


        relationship_score = 0


        if text_similarity >= 0.55:

            relationship_score += 1


        if location_similarity >= 0.60:

            relationship_score += 1


        if same_category:

            relationship_score += 1


        if relationship_score >= 2:

            related_reports.append({

                "incident_id":
                    report["incident_id"],

                "text_similarity":
                    text_similarity,

                "location_similarity":
                    location_similarity,

                "same_category":
                    same_category,

                "relationship_score":
                    relationship_score

            })


    return related_reports


# ============================================================
# EXPLANATION
# ============================================================

def generate_explanation(
    category_result,
    severity_result,
    related_reports
):

    category = category_result["category"]

    confidence = category_result["confidence"]

    severity = severity_result["severity"]


    explanation_parts = []


    explanation_parts.append(

        f"Issue classified as {category} "
        f"with {confidence.lower()} confidence."

    )


    explanation_parts.append(

        f"Recommended severity: {severity}."

    )


    if related_reports:

        explanation_parts.append(

            f"{len(related_reports)} "
            f"potentially related report(s) "
            f"were detected using text, category "
            f"and location similarity."

        )

    else:

        explanation_parts.append(

            "No strongly related existing report "
            "was detected."

        )


    return " ".join(
        explanation_parts
    )


# ============================================================
# MAIN ANALYSIS PIPELINE
# ============================================================

def analyze_report(
    report,
    existing_reports
):

    category_result = classify_category(

        title=report["title"],

        description=report["description"],

        submitted_category=report["category"]

    )


    severity_result = analyze_severity(

        title=report["title"],

        description=report["description"],

        submitted_severity=report["severity"]

    )


    analyzed_report = {

        **report,

        "category":
            category_result["category"],

        "severity":
            severity_result["severity"]

    }


    related_reports = find_related_reports(

        new_report=analyzed_report,

        existing_reports=existing_reports

    )


    explanation = generate_explanation(

        category_result,

        severity_result,

        related_reports

    )


    if related_reports:

        incident_type = (
            "Potential Related Incident"
        )

    else:

        incident_type = (
            "Potential New Incident"
        )


    return {

        "category":
            category_result,

        "severity":
            severity_result,

        "related_reports":
            related_reports,

        "incident_type":
            incident_type,

        "explanation":
            explanation

    }