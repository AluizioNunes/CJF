from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.escritorio import Escritorio
from ..schemas.escritorio import EscritorioCreate, EscritorioRead, EscritorioUpdate
from ..models.auditoria import Auditoria
from .utils import upper_except_email, build_diff


router = APIRouter()


@router.get("/", response_model=List[EscritorioRead], summary="Listar Escritórios")
def list_escritorios(db: Session = Depends(get_db)) -> List[EscritorioRead]:
    return db.query(Escritorio).all()


@router.post("/", response_model=EscritorioRead, summary="Criar Escritório")
def create_escritorio(payload: EscritorioCreate, db: Session = Depends(get_db)) -> EscritorioRead:
    data = upper_except_email(payload.model_dump())
    row = Escritorio(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    db.add(Auditoria(entidade="Escritorios", entidade_id=row.id, acao="create", quem="SYSTEM", diff=build_diff(None, data)))
    db.commit()
    return row


@router.put("/{row_id}", response_model=EscritorioRead, summary="Atualizar Escritório")
def update_escritorio(row_id: int, payload: EscritorioUpdate, db: Session = Depends(get_db)) -> EscritorioRead:
    row = db.get(Escritorio, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Escritório não encontrado")
    before = {"nome": row.nome, "cnpj": row.cnpj, "email": row.email, "telefone": row.telefone}
    data = upper_except_email(payload.model_dump(exclude_unset=True))
    for k, v in data.items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    db.add(Auditoria(entidade="Escritorios", entidade_id=row.id, acao="update", quem="SYSTEM", diff=build_diff(before, data)))
    db.commit()
    return row


@router.delete("/{row_id}", summary="Remover Escritório")
def delete_escritorio(row_id: int, db: Session = Depends(get_db)) -> Dict[str, str]:
    row = db.get(Escritorio, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Escritório não encontrado")
    before = {"nome": row.nome, "cnpj": row.cnpj, "email": row.email, "telefone": row.telefone}
    db.delete(row)
    db.commit()
    db.add(Auditoria(entidade="Escritorios", entidade_id=row_id, acao="delete", quem="SYSTEM", diff=build_diff(before, None)))
    db.commit()
    return {"status": "deleted"}