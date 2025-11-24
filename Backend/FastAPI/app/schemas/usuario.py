from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from .common import UppercaseModel


class UsuarioBase(UppercaseModel):
    username: str
    nome: str
    email: Optional[str] = None
    role: Optional[str] = None
    permissoes: Optional[str] = None  # JSON serializado
    advogado_id: Optional[int] = None


class UsuarioCreate(UsuarioBase):
    senha: Optional[str] = None


class UsuarioRead(UsuarioBase):
    id: int
    escritorios: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class UsuarioUpdate(UppercaseModel):
    username: Optional[str] = None
    nome: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    permissoes: Optional[str] = None
    senha: Optional[str] = None
    advogado_id: Optional[int] = None