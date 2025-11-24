from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.permissao import Permissao
from ..schemas.permissao import PermissaoCreate, PermissaoRead, PermissaoUpdate
from ..models.auditoria import Auditoria
from .utils import upper_except_email, build_diff


router = APIRouter()


@router.get("/", response_model=List[PermissaoRead], summary="Listar Permissões")
def list_permissoes(db: Session = Depends(get_db)) -> List[PermissaoRead]:
    return db.query(Permissao).all()


@router.post("/", response_model=PermissaoRead, summary="Criar Permissão")
def create_permissao(payload: PermissaoCreate, db: Session = Depends(get_db)) -> PermissaoRead:
    data = upper_except_email(payload.model_dump())
    row = Permissao(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    db.add(Auditoria(entidade="Permissoes", entidade_id=row.id, acao="create", quem="SYSTEM", diff=build_diff(None, data)))
    db.commit()
    return row


@router.put("/{row_id}", response_model=PermissaoRead, summary="Atualizar Permissão")
def update_permissao(row_id: int, payload: PermissaoUpdate, db: Session = Depends(get_db)) -> PermissaoRead:
    row = db.get(Permissao, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Permissão não encontrada")
    before = {"nome": row.nome, "descricao": row.descricao}
    data = upper_except_email(payload.model_dump(exclude_unset=True))
    for k, v in data.items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    db.add(Auditoria(entidade="Permissoes", entidade_id=row.id, acao="update", quem="SYSTEM", diff=build_diff(before, data)))
    db.commit()
    return row


@router.delete("/{row_id}", summary="Remover Permissão")
def delete_permissao(row_id: int, db: Session = Depends(get_db)) -> Dict[str, str]:
    row = db.get(Permissao, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Permissão não encontrada")
    before = {"nome": row.nome, "descricao": row.descricao}
    db.delete(row)
    db.commit()
    db.add(Auditoria(entidade="Permissoes", entidade_id=row_id, acao="delete", quem="SYSTEM", diff=build_diff(before, None)))
    db.commit()
    return {"status": "deleted"}