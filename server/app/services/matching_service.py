from sqlalchemy.orm import Session
from app.models.university import University
from app.models.user import User


def match_universities(db: Session, user: User) -> list[University]:
    universities = db.query(University).all()
    result = []

    for uni in universities:
        reqs = uni.requirements or {}

        if user.gpa is not None:
            min_gpa = reqs.get("min_gpa")
            if min_gpa and user.gpa < min_gpa:
                continue

        if user.test_scores:
            for test_key, req_key in [("IELTS", "min_IELTS"), ("TOEFL", "min_TOEFL"), ("SAT", "min_SAT")]:
                student_score = user.test_scores.get(test_key)
                required_score = reqs.get(req_key)
                if student_score is not None and required_score and student_score < required_score:
                    break
            else:
                pass

        if user.country_preference:
            if uni.country not in user.country_preference:
                continue

        if user.specialty_preference and uni.specialties:
            if not any(
                user.specialty_preference.lower() in s.lower()
                for s in uni.specialties
            ):
                continue

        result.append(uni)

    return result
