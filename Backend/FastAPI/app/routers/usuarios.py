from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.usuario import Usuario
from ..models.advogado_escritorio import AdvogadoEscritorio
from ..models.escritorio import Escritorio
from ..schemas.usuario import UsuarioCreate, UsuarioRead, UsuarioUpdate
from ..models.auditoria import Auditoria
from .utils import upper_except_email, build_diff


router = APIRouter()


@router.get("/", response_model=List[UsuarioRead], summary="Listar Usuários")
def list_usuarios(db: Session = Depends(get_db)) -> List[UsuarioRead]:
    rows = db.query(Usuario).all()
    result: List[UsuarioRead] = []  # type: ignore
    for r in rows:
        nomes = None
        if r.advogado_id:
            links = db.query(AdvogadoEscritorio).filter(AdvogadoEscritorio.advogado_id == r.advogado_id).all()
            ids = [lk.escritorio_id for lk in links]
            if ids:
                offices = db.query(Escritorio).filter(Escritorio.id.in_(ids)).all()
                nomes = ", ".join([o.nome for o in offices]) if offices else None
        result.append({
            "id": r.id,
            "username": r.username,
            "nome": r.nome,
            "email": r.email,
            "role": r.role,
            "permissoes": r.permissoes,
            "advogado_id": r.advogado_id,
            "escritorios": nomes,
        })  # type: ignore
    return result


@router.post("/", response_model=UsuarioRead, summary="Criar Usuário")
def create_usuario(payload: UsuarioCreate, db: Session = Depends(get_db)) -> UsuarioRead:
    data = upper_except_email(payload.model_dump())
    row = Usuario(
        username=data.get("username"),
        nome=data.get("nome"),
        email=data.get("email"),
        role=data.get("role"),
        permissoes=data.get("permissoes"),
        senha_hash=data.get("senha"),
        advogado_id=data.get("advogado_id"),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    db.add(Auditoria(entidade="Usuarios", entidade_id=row.id, acao="create", quem="SYSTEM", diff=build_diff(None, data)))
    db.commit()
    return row


@router.put("/{row_id}", response_model=UsuarioRead, summary="Atualizar Usuário")
def update_usuario(row_id: int, payload: UsuarioUpdate, db: Session = Depends(get_db)) -> UsuarioRead:
    row = db.get(Usuario, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    before = {
        "username": row.username,
        "nome": row.nome,
        "email": row.email,
        "role": row.role,
        "permissoes": row.permissoes,
    }
    data = upper_except_email(payload.model_dump(exclude_unset=True))
    if "senha" in data:
        row.senha_hash = data.pop("senha")
    for k, v in data.items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    db.add(Auditoria(entidade="Usuarios", entidade_id=row.id, acao="update", quem="SYSTEM", diff=build_diff(before, data)))
    db.commit()
    return row


@router.delete("/{row_id}", summary="Remover Usuário")
def delete_usuario(row_id: int, db: Session = Depends(get_db)) -> Dict[str, str]:
    row = db.get(Usuario, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    before = {
        "username": row.username,
        "nome": row.nome,
        "email": row.email,
        "role": row.role,
        "permissoes": row.permissoes,
    }
    db.delete(row)
    db.commit()
    db.add(Auditoria(entidade="Usuarios", entidade_id=row_id, acao="delete", quem="SYSTEM", diff=build_diff(before, None)))
    db.commit()
    return {"status": "deleted"}