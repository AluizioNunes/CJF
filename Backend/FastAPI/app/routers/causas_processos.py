from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models.causas_processos import CausaProcesso
from ..schemas.causas_processos import CausaProcessoCreate, CausaProcessoRead, CausaProcessoUpdate
from ..models.auditoria import Auditoria
from .utils import upper_except_email, build_diff


router = APIRouter()


@router.get("/", response_model=List[CausaProcessoRead], summary="Listar Causas e Processos")
def list_causas(db: Session = Depends(get_db)) -> List[CausaProcessoRead]:
    return db.query(CausaProcesso).all()


@router.post("/", response_model=CausaProcessoRead, summary="Criar Causa/Processo")
def create_causa(payload: CausaProcessoCreate, db: Session = Depends(get_db)) -> CausaProcessoRead:
    data = upper_except_email(payload.model_dump())
    row = CausaProcesso(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    db.add(Auditoria(entidade="CausasProcessos", entidade_id=row.id, acao="create", quem="SYSTEM", diff=build_diff(None, data)))
    db.commit()
    return row


@router.put("/{row_id}", response_model=CausaProcessoRead, summary="Atualizar Causa/Processo")
def update_causa(row_id: int, payload: CausaProcessoUpdate, db: Session = Depends(get_db)) -> CausaProcessoRead:
    row = db.get(CausaProcesso, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    before = {
        "numero": row.numero,
        "descricao": row.descricao,
        "status": row.status,
        "cliente_id": row.cliente_id,
        "advogado_id": row.advogado_id,
        "escritorio_id": row.escritorio_id,
        "especialidade_id": row.especialidade_id,
        "valor": float(row.valor) if row.valor is not None else None,
    }
    data = upper_except_email(payload.model_dump(exclude_unset=True))
    for k, v in data.items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    db.add(Auditoria(entidade="CausasProcessos", entidade_id=row.id, acao="update", quem="SYSTEM", diff=build_diff(before, data)))
    db.commit()
    return row


@router.delete("/{row_id}", summary="Remover Causa/Processo")
def delete_causa(row_id: int, db: Session = Depends(get_db)) -> Dict[str, str]:
    row = db.get(CausaProcesso, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    before = {
        "numero": row.numero,
        "descricao": row.descricao,
        "status": row.status,
        "cliente_id": row.cliente_id,
        "advogado_id": row.advogado_id,
        "escritorio_id": row.escritorio_id,
        "especialidade_id": row.especialidade_id,
        "valor": float(row.valor) if row.valor is not None else None,
    }
    db.delete(row)
    db.commit()
    db.add(Auditoria(entidade="CausasProcessos", entidade_id=row_id, acao="delete", quem="SYSTEM", diff=build_diff(before, None)))
    db.commit()
    return {"status": "deleted"}


@router.get("/sum", summary="Somar valores de causas")
def sum_valores_causas(db: Session = Depends(get_db)) -> Dict[str, float]:
    total = db.query(func.coalesce(func.sum(CausaProcesso.valor), 0)).scalar() or 0
    try:
        total_num = float(total)
    except Exception:
        total_num = 0.0
    return {"total": total_num}