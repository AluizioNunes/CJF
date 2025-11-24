from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.parametro import Parametro
from ..schemas.parametro import ParametroCreate, ParametroRead, ParametroUpdate
from ..models.auditoria import Auditoria
from .utils import upper_except_email, build_diff


router = APIRouter()


@router.get("/", response_model=List[ParametroRead], summary="Listar Parâmetros")
def list_parametros(db: Session = Depends(get_db)) -> List[ParametroRead]:
    return db.query(Parametro).all()


@router.post("/", response_model=ParametroRead, summary="Criar/Atualizar Parâmetro por chave")
def upsert_parametro(payload: ParametroCreate, db: Session = Depends(get_db)) -> ParametroRead:
    data = upper_except_email(payload.model_dump())
    row = db.query(Parametro).filter(Parametro.chave == data["chave"]).first()
    if row:
        before = {"chave": row.chave, "valor": row.valor}
        row.valor = data.get("valor")
        db.commit()
        db.refresh(row)
        db.add(Auditoria(entidade="Parametros", entidade_id=row.id, acao="update", quem="SYSTEM", diff=build_diff(before, data)))
        db.commit()
        return row
    row = Parametro(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    db.add(Auditoria(entidade="Parametros", entidade_id=row.id, acao="create", quem="SYSTEM", diff=build_diff(None, data)))
    db.commit()
    return row


@router.put("/{row_id}", response_model=ParametroRead, summary="Atualizar Parâmetro")
def update_parametro(row_id: int, payload: ParametroUpdate, db: Session = Depends(get_db)) -> ParametroRead:
    row = db.get(Parametro, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Parâmetro não encontrado")
    before = {"chave": row.chave, "valor": row.valor}
    data = upper_except_email(payload.model_dump(exclude_unset=True))
    for k, v in data.items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    db.add(Auditoria(entidade="Parametros", entidade_id=row.id, acao="update", quem="SYSTEM", diff=build_diff(before, data)))
    db.commit()
    return row


@router.delete("/{row_id}", summary="Remover Parâmetro")
def delete_parametro(row_id: int, db: Session = Depends(get_db)) -> Dict[str, str]:
    row = db.get(Parametro, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Parâmetro não encontrado")
    before = {"chave": row.chave, "valor": row.valor}
    db.delete(row)
    db.commit()
    db.add(Auditoria(entidade="Parametros", entidade_id=row_id, acao="delete", quem="SYSTEM", diff=build_diff(before, None)))
    db.commit()
    return {"status": "deleted"}