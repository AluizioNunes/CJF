from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.advogado import Advogado
from ..schemas.advogado import AdvogadoCreate, AdvogadoRead, AdvogadoUpdate
from ..models.auditoria import Auditoria
from .utils import upper_except_email, build_diff


router = APIRouter()


@router.get("/", response_model=List[AdvogadoRead], summary="Listar Advogados")
def list_advogados(db: Session = Depends(get_db)) -> List[AdvogadoRead]:
    return db.query(Advogado).all()


@router.post("/", response_model=AdvogadoRead, summary="Criar Advogado")
def create_advogado(payload: AdvogadoCreate, db: Session = Depends(get_db)) -> AdvogadoRead:
    data = upper_except_email(payload.model_dump())
    row = Advogado(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    db.add(Auditoria(entidade="Advogados", entidade_id=row.id, acao="create", quem="SYSTEM", diff=build_diff(None, data)))
    db.commit()
    return row


@router.put("/{row_id}", response_model=AdvogadoRead, summary="Atualizar Advogado")
def update_advogado(row_id: int, payload: AdvogadoUpdate, db: Session = Depends(get_db)) -> AdvogadoRead:
    row = db.get(Advogado, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Advogado não encontrado")
    before = {"nome": row.nome, "oab": row.oab, "email": row.email, "telefone": row.telefone, "especialidade_id": row.especialidade_id}
    data = upper_except_email(payload.model_dump(exclude_unset=True))
    for k, v in data.items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    db.add(Auditoria(entidade="Advogados", entidade_id=row.id, acao="update", quem="SYSTEM", diff=build_diff(before, data)))
    db.commit()
    return row


@router.delete("/{row_id}", summary="Remover Advogado")
def delete_advogado(row_id: int, db: Session = Depends(get_db)) -> Dict[str, str]:
    row = db.get(Advogado, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Advogado não encontrado")
    before = {"nome": row.nome, "oab": row.oab, "email": row.email, "telefone": row.telefone, "especialidade_id": row.especialidade_id}
    db.delete(row)
    db.commit()
    db.add(Auditoria(entidade="Advogados", entidade_id=row_id, acao="delete", quem="SYSTEM", diff=build_diff(before, None)))
    db.commit()
    return {"status": "deleted"}