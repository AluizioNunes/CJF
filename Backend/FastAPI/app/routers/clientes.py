from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.cliente import Cliente
from ..schemas.cliente import ClienteCreate, ClienteRead, ClienteUpdate
from ..models.auditoria import Auditoria
from .utils import upper_except_email, build_diff


router = APIRouter()


@router.get("/", response_model=List[ClienteRead], summary="Listar Clientes")
def list_clientes(db: Session = Depends(get_db)) -> List[ClienteRead]:
    return db.query(Cliente).all()


@router.post("/", response_model=ClienteRead, summary="Criar Cliente")
def create_cliente(payload: ClienteCreate, db: Session = Depends(get_db)) -> ClienteRead:
    data = upper_except_email(payload.model_dump())
    row = Cliente(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    db.add(Auditoria(entidade="Clientes", entidade_id=row.id, acao="create", quem="SYSTEM", diff=build_diff(None, data)))
    db.commit()
    return row


@router.put("/{row_id}", response_model=ClienteRead, summary="Atualizar Cliente")
def update_cliente(row_id: int, payload: ClienteUpdate, db: Session = Depends(get_db)) -> ClienteRead:
    row = db.get(Cliente, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    before = {"nome": row.nome, "cpf_cnpj": row.cpf_cnpj, "email": row.email, "telefone": row.telefone}
    data = upper_except_email(payload.model_dump(exclude_unset=True))
    for k, v in data.items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    db.add(Auditoria(entidade="Clientes", entidade_id=row.id, acao="update", quem="SYSTEM", diff=build_diff(before, data)))
    db.commit()
    return row


@router.delete("/{row_id}", summary="Remover Cliente")
def delete_cliente(row_id: int, db: Session = Depends(get_db)) -> Dict[str, str]:
    row = db.get(Cliente, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    before = {"nome": row.nome, "cpf_cnpj": row.cpf_cnpj, "email": row.email, "telefone": row.telefone}
    db.delete(row)
    db.commit()
    db.add(Auditoria(entidade="Clientes", entidade_id=row_id, acao="delete", quem="SYSTEM", diff=build_diff(before, None)))
    db.commit()
    return {"status": "deleted"}