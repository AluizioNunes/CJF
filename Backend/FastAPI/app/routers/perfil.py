from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.perfil import Perfil
from ..schemas.perfil import PerfilCreate, PerfilRead, PerfilUpdate
from ..models.auditoria import Auditoria
from .utils import upper_except_email, build_diff


router = APIRouter()


@router.get("/", response_model=List[PerfilRead], summary="Listar Perfis")
def list_perfis(db: Session = Depends(get_db)) -> List[PerfilRead]:
    return db.query(Perfil).all()


@router.post("/", response_model=PerfilRead, summary="Criar Perfil")
def create_perfil(payload: PerfilCreate, db: Session = Depends(get_db)) -> PerfilRead:
    data = upper_except_email(payload.model_dump())
    row = Perfil(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    db.add(Auditoria(entidade="Perfil", entidade_id=row.id, acao="create", quem="SYSTEM", diff=build_diff(None, data)))
    db.commit()
    return row


@router.put("/{row_id}", response_model=PerfilRead, summary="Atualizar Perfil")
def update_perfil(row_id: int, payload: PerfilUpdate, db: Session = Depends(get_db)) -> PerfilRead:
    row = db.get(Perfil, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    before = {"nome": row.nome, "descricao": row.descricao}
    data = upper_except_email(payload.model_dump(exclude_unset=True))
    for k, v in data.items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    db.add(Auditoria(entidade="Perfil", entidade_id=row.id, acao="update", quem="SYSTEM", diff=build_diff(before, data)))
    db.commit()
    return row


@router.delete("/{row_id}", summary="Remover Perfil")
def delete_perfil(row_id: int, db: Session = Depends(get_db)) -> Dict[str, str]:
    row = db.get(Perfil, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    before = {"nome": row.nome, "descricao": row.descricao}
    db.delete(row)
    db.commit()
    db.add(Auditoria(entidade="Perfil", entidade_id=row_id, acao="delete", quem="SYSTEM", diff=build_diff(before, None)))
    db.commit()
    return {"status": "deleted"}