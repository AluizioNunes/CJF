from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.auditoria import Auditoria
from ..schemas.auditoria import AuditoriaRead


router = APIRouter()


@router.get("/", response_model=List[AuditoriaRead], summary="Listar Auditoria")
def list_auditoria(db: Session = Depends(get_db)) -> List[AuditoriaRead]:
    return db.query(Auditoria).order_by(Auditoria.id.desc()).limit(200).all()