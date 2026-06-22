import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import require_admin
from app.models.case import Case
from app.schemas.case import CaseCreate, CaseUpdate, CaseResponse

router = APIRouter(prefix="/cases", tags=["cases"])


# GET'ы публичные: кейсы (истории успеха) показываются на маркетинговом лендинге
# анонимным посетителям. Без этого фронт ловит 401 и редиректит гостя на /login.
@router.get("", response_model=list[CaseResponse])
def list_cases(db: Session = Depends(get_db)):
    return db.query(Case).order_by(Case.published_at.desc()).all()


@router.get("/{case_id}", response_model=CaseResponse)
def get_case(case_id: uuid.UUID, db: Session = Depends(get_db)):
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Кейс не найден")
    return case


@router.post("", response_model=CaseResponse, status_code=201)
def create_case(body: CaseCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    case = Case(**body.model_dump())
    db.add(case)
    db.commit()
    db.refresh(case)
    return case


@router.patch("/{case_id}", response_model=CaseResponse)
def update_case(
    case_id: uuid.UUID,
    body: CaseUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Кейс не найден")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(case, field, value)
    db.commit()
    db.refresh(case)
    return case


@router.delete("/{case_id}", status_code=204)
def delete_case(case_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(require_admin)):
    case = db.get(Case, case_id)
    if not case:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Кейс не найден")
    db.delete(case)
    db.commit()
