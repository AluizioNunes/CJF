from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from ..database import get_db
from ..models.usuario import Usuario


router = APIRouter()


@router.post("/login", summary="Login simples")
def login(payload: Dict[str, str], db: Session = Depends(get_db)) -> Dict[str, Any]:
    username = (payload.get("username") or "").strip()
    password = (payload.get("password") or "").strip()
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username e password são obrigatórios")

    user = db.query(Usuario).filter(Usuario.username == username).first()
    if not user or (user.senha_hash or "") != password:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    token = f"dev-{user.id}"
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
        },
    }


def _resolve_token_user(authorization: Optional[str], db: Session) -> Optional[Usuario]:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    token = authorization.split(" ", 1)[1].strip()
    if token == "dev-token":
        # Usuário de desenvolvimento
        return Usuario(id=0, username="dev", nome="DESENVOLVIMENTO", email=None, role="DEV", senha_hash=None, permissoes=None)  # type: ignore
    if token.startswith("dev-"):
        try:
            uid = int(token.removeprefix("dev-"))
        except ValueError:
            return None
        return db.get(Usuario, uid)
    return None


@router.get("/me", summary="Usuário atual")
def me(authorization: Optional[str] = Header(default=None), db: Session = Depends(get_db)) -> Dict[str, Any]:
    user = _resolve_token_user(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail="Não autenticado")
    return {
        "id": user.id,
        "username": user.username,
        "nome": user.nome,
        "email": user.email,
        "role": user.role,
        "permissoes": user.permissoes,
    }