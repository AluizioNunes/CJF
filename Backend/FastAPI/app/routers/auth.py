from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from ..database import get_db
from ..models.usuario import Usuario
from ..models.usuario_escritorio import UsuarioEscritorio
from ..models.escritorio import Escritorio
from ..models.advogado import Advogado
from ..models.advogado_escritorio import AdvogadoEscritorio


router = APIRouter()


@router.post("/login", summary="Login simples")
def login(payload: Dict[str, str], db: Session = Depends(get_db)) -> Dict[str, Any]:
    username = (payload.get("username") or "").strip()
    password = (payload.get("password") or "").strip()
    escritorio_id_raw = payload.get("escritorio_id")
    escritorio_id = int(escritorio_id_raw) if escritorio_id_raw and str(escritorio_id_raw).isdigit() else None
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username e password são obrigatórios")

    user = db.query(Usuario).filter(Usuario.username == username).first()
    if not user or (user.senha_hash or "") != password:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    if escritorio_id is None:
        raise HTTPException(status_code=400, detail="Escritório é obrigatório")
    office = db.get(Escritorio, escritorio_id)
    assoc = db.query(UsuarioEscritorio).filter(UsuarioEscritorio.usuario_id == user.id, UsuarioEscritorio.escritorio_id == escritorio_id).first()
    adv = db.get(Advogado, user.advogado_id) if user.advogado_id else None
    if adv:
        advAssoc = db.query(AdvogadoEscritorio).filter(AdvogadoEscritorio.advogado_id == adv.id, AdvogadoEscritorio.escritorio_id == escritorio_id).first()
        if not advAssoc:
            raise HTTPException(status_code=403, detail=f"Usuário {user.nome} não está associado ao escritório {office.nome if office else ''}")
    elif not assoc:
        raise HTTPException(status_code=403, detail=f"Usuário {user.nome} não está associado ao escritório {office.nome if office else ''}")
    token = f"dev-{user.id}@{escritorio_id}"
    adv = db.get(Advogado, user.advogado_id) if user.advogado_id else None
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "nome": user.nome,
            "email": user.email,
            "role": user.role,
            "permissoes": user.permissoes,
            "escritorioNome": office and office.nome,
            "advogadoNome": adv and adv.nome,
            "advogadoOab": adv and adv.oab,
        },
    }


def _resolve_token(authorization: Optional[str], db: Session) -> Optional[Dict[str, Any]]:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    token = authorization.split(" ", 1)[1].strip()
    if token == "dev-token":
        return {"user": Usuario(id=0, username="dev", nome="DESENVOLVIMENTO", email=None, role="DEV", senha_hash=None, permissoes=None), "escritorio_id": None}  # type: ignore
    if token.startswith("dev-"):
        ctx = token.removeprefix("dev-")
        parts = ctx.split("@")
        try:
            uid = int(parts[0])
        except ValueError:
            return None
        esc_id = None
        if len(parts) > 1:
            try:
                esc_id = int(parts[1])
            except ValueError:
                esc_id = None
        return {"user": db.get(Usuario, uid), "escritorio_id": esc_id}
    return None


@router.get("/me", summary="Usuário atual")
def me(authorization: Optional[str] = Header(default=None), db: Session = Depends(get_db)) -> Dict[str, Any]:
    ctx = _resolve_token(authorization, db)
    if not ctx or not ctx.get("user"):
        raise HTTPException(status_code=401, detail="Não autenticado")
    user: Usuario = ctx["user"]
    esc_id = ctx.get("escritorio_id")
    office = db.get(Escritorio, esc_id) if esc_id else None
    adv = db.get(Advogado, user.advogado_id) if user.advogado_id else None
    return {
        "id": user.id,
        "username": user.username,
        "nome": user.nome,
        "email": user.email,
        "role": user.role,
        "permissoes": user.permissoes,
        "escritorioNome": office and office.nome,
        "advogadoNome": adv and adv.nome,
        "advogadoOab": adv and adv.oab,
    }