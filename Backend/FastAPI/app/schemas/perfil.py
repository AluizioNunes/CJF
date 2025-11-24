from pydantic import BaseModel, ConfigDict
from typing import Optional
from .common import UppercaseModel


class PerfilBase(UppercaseModel):
    nome: str
    descricao: Optional[str] = None


class PerfilCreate(PerfilBase):
    pass


class PerfilRead(PerfilBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class PerfilUpdate(UppercaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None