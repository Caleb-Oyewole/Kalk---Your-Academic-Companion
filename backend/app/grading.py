"""Nigerian 5.0 scale (OAU style) grading and CGPA maths."""
from collections import OrderedDict
from typing import Iterable, Optional

GRADE_POINTS = {"A": 5, "B": 4, "C": 3, "D": 2, "E": 1, "F": 0}


def grade_from_score(score: Optional[float]) -> Optional[str]:
    if score is None:
        return None
    if score >= 70:
        return "A"
    if score >= 60:
        return "B"
    if score >= 50:
        return "C"
    if score >= 45:
        return "D"
    if score >= 40:
        return "E"
    return "F"


def points_for(grade: Optional[str]) -> Optional[int]:
    if not grade:
        return None
    return GRADE_POINTS.get(grade.upper())


def _usable(course) -> bool:
    return (
        not course.excluded
        and course.units is not None
        and course.units > 0
        and points_for(course.grade) is not None
    )


def _gpa(courses) -> dict:
    units = sum(c.units for c in courses)
    qp = sum(c.units * points_for(c.grade) for c in courses)
    return {
        "units": units,
        "quality_points": qp,
        "gpa": round(qp / units, 2) if units else 0.0,
    }


def compute_cgpa(courses: Iterable) -> dict:
    courses = list(courses)
    counted = [c for c in courses if _usable(c)]
    overall = _gpa(counted)

    by_term: "OrderedDict[str, list]" = OrderedDict()
    for c in counted:
        key = f"{c.session} {c.semester}".strip() or "Unspecified"
        by_term.setdefault(key, []).append(c)
    terms = [{"term": k, **_gpa(v)} for k, v in by_term.items()]

    return {
        "cgpa": overall["gpa"],
        "total_units": overall["units"],
        "total_quality_points": overall["quality_points"],
        "courses_counted": len(counted),
        "courses_excluded": sum(1 for c in courses if c.excluded),
        "courses_needing_review": sum(1 for c in courses if c.needs_review),
        "terms": terms,
    }
