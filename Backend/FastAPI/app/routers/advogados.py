from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.advogado import Advogado
from ..models.advogado_escritorio import AdvogadoEscritorio
from ..models.escritorio import Escritorio
from ..schemas.escritorio import EscritorioRead
from ..schemas.advogado import AdvogadoCreate, AdvogadoRead, AdvogadoUpdate
from ..models.auditoria import Auditoria
from .utils import upper_except_email, build_diff


router = APIRouter()


@router.get("/", response_model=None, summary="Listar Advogados")
def list_advogados(db: Session = Depends(get_db)):
    rows = db.query(Advogado).all()
    out: List[AdvogadoRead] = []  # type: ignore
    for r in rows:
        links = db.query(AdvogadoEscritorio).filter(AdvogadoEscritorio.advogado_id == r.id).all()
        ids = [lk.escritorio_id for lk in links]
        escrs = db.query(Escritorio).filter(Escritorio.id.in_(ids)).all() if ids else []
        escrs_json = [{"id": e.id, "nome": e.nome} for e in escrs]
        out.append({
            "id": r.id,
            "nome": r.nome,
            "oab": r.oab,
            "email": r.email,
            "telefone": r.telefone,
            "especialidade_id": r.especialidade_id,
            "escritorios_ids": ids,
            "escritorios": escrs_json,
        })  # type: ignore
    return out


@router.post("/", response_model=None, summary="Criar Advogado")
def create_advogado(payload: AdvogadoCreate, db: Session = Depends(get_db)):
    data = upper_except_email(payload.model_dump())
    row = Advogado(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    esc_ids = (payload.escritorios_ids or [])
    for eid in esc_ids:
        if not db.query(AdvogadoEscritorio).filter(AdvogadoEscritorio.advogado_id == row.id, AdvogadoEscritorio.escritorio_id == eid).first():
            db.add(AdvogadoEscritorio(advogado_id=row.id, escritorio_id=eid))
            db.commit()
    db.add(Auditoria(entidade="Advogados", entidade_id=row.id, acao="create", quem="SYSTEM", diff=build_diff(None, data)))
    db.commit()
    links = db.query(AdvogadoEscritorio).filter(AdvogadoEscritorio.advogado_id == row.id).all()
    ids = [lk.escritorio_id for lk in links]
    escrs = db.query(Escritorio).filter(Escritorio.id.in_(ids)).all() if ids else []
    escrs_json = [{"id": e.id, "nome": e.nome} for e in escrs]
    return {  # type: ignore
        "id": row.id,
        "nome": row.nome,
        "oab": row.oab,
        "email": row.email,
        "telefone": row.telefone,
        "especialidade_id": row.especialidade_id,
        "escritorios_ids": ids,
        "escritorios": escrs_json,
    }


@router.put("/{row_id}", response_model=None, summary="Atualizar Advogado")
def update_advogado(row_id: int, payload: AdvogadoUpdate, db: Session = Depends(get_db)):
    row = db.get(Advogado, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Advogado não encontrado")
    before = {"nome": row.nome, "oab": row.oab, "email": row.email, "telefone": row.telefone, "especialidade_id": row.especialidade_id}
    data = upper_except_email(payload.model_dump(exclude_unset=True))
    for k, v in data.items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    if payload.escritorios_ids is not None:
        new_ids = set(payload.escritorios_ids)
        curr_links = db.query(AdvogadoEscritorio).filter(AdvogadoEscritorio.advogado_id == row.id).all()
        curr_ids = set(lk.escritorio_id for lk in curr_links)
        # Remover os que não estão mais
        for lk in curr_links:
            if lk.escritorio_id not in new_ids:
                db.delete(lk)
        db.commit()
        # Adicionar novos
        for eid in new_ids:
            if eid not in curr_ids:
                db.add(AdvogadoEscritorio(advogado_id=row.id, escritorio_id=eid))
        db.commit()
    db.add(Auditoria(entidade="Advogados", entidade_id=row.id, acao="update", quem="SYSTEM", diff=build_diff(before, data)))
    db.commit()
    links = db.query(AdvogadoEscritorio).filter(AdvogadoEscritorio.advogado_id == row.id).all()
    ids = [lk.escritorio_id for lk in links]
    escrs = db.query(Escritorio).filter(Escritorio.id.in_(ids)).all() if ids else []
    escrs_json = [{"id": e.id, "nome": e.nome} for e in escrs]
    return {  # type: ignore
        "id": row.id,
        "nome": row.nome,
        "oab": row.oab,
        "email": row.email,
        "telefone": row.telefone,
        "especialidade_id": row.especialidade_id,
        "escritorios_ids": ids,
        "escritorios": escrs_json,
    }


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


@router.get("/{row_id}/escritorios", response_model=None, summary="Listar Escritórios do Advogado")
def list_escritorios_do_advogado(row_id: int, db: Session = Depends(get_db)):
    adv = db.get(Advogado, row_id)
    if not adv:
        raise HTTPException(status_code=404, detail="Advogado não encontrado")
    links = db.query(AdvogadoEscritorio).filter(AdvogadoEscritorio.advogado_id == row_id).all()
    ids = [lk.escritorio_id for lk in links]
    if not ids:
        return []
    return db.query(Escritorio).filter(Escritorio.id.in_(ids)).all()