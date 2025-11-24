from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.especialidade import Especialidade
from ..schemas.especialidade import EspecialidadeCreate, EspecialidadeRead, EspecialidadeUpdate
from ..models.auditoria import Auditoria
from .utils import upper_except_email, build_diff


router = APIRouter()


@router.get("/", response_model=List[EspecialidadeRead], summary="Listar Especialidades")
def list_especialidades(db: Session = Depends(get_db)) -> List[EspecialidadeRead]:
    return db.query(Especialidade).all()


@router.post("/", response_model=EspecialidadeRead, summary="Criar Especialidade")
def create_especialidade(payload: EspecialidadeCreate, db: Session = Depends(get_db)) -> EspecialidadeRead:
    data = upper_except_email(payload.model_dump())
    row = Especialidade(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    db.add(Auditoria(entidade="Especialidades", entidade_id=row.id, acao="create", quem="SYSTEM", diff=build_diff(None, data)))
    db.commit()
    return row


@router.put("/{row_id}", response_model=EspecialidadeRead, summary="Atualizar Especialidade")
def update_especialidade(row_id: int, payload: EspecialidadeUpdate, db: Session = Depends(get_db)) -> EspecialidadeRead:
    row = db.get(Especialidade, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Especialidade não encontrada")
    before = {"nome": row.nome, "descricao": row.descricao}
    data = upper_except_email(payload.model_dump(exclude_unset=True))
    for k, v in data.items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    db.add(Auditoria(entidade="Especialidades", entidade_id=row.id, acao="update", quem="SYSTEM", diff=build_diff(before, data)))
    db.commit()
    return row


@router.delete("/{row_id}", summary="Remover Especialidade")
def delete_especialidade(row_id: int, db: Session = Depends(get_db)) -> Dict[str, str]:
    row = db.get(Especialidade, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Especialidade não encontrada")
    before = {"nome": row.nome, "descricao": row.descricao}
    db.delete(row)
    db.commit()
    db.add(Auditoria(entidade="Especialidades", entidade_id=row_id, acao="delete", quem="SYSTEM", diff=build_diff(before, None)))
    db.commit()
    return {"status": "deleted"}