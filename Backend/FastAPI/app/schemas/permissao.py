from pydantic import BaseModel, ConfigDict
from typing import Optional
from .common import UppercaseModel


class PermissaoBase(UppercaseModel):
    nome: str
    descricao: Optional[str] = None


class PermissaoCreate(PermissaoBase):
    pass


class PermissaoRead(PermissaoBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class PermissaoUpdate(UppercaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None