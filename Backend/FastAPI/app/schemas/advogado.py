from pydantic import BaseModel, ConfigDict
from typing import Optional
from .common import UppercaseModel


class AdvogadoBase(UppercaseModel):
    nome: str
    oab: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    especialidade_id: Optional[int] = None


class AdvogadoCreate(AdvogadoBase):
    pass


class AdvogadoRead(AdvogadoBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class AdvogadoUpdate(UppercaseModel):
    nome: Optional[str] = None
    oab: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    especialidade_id: Optional[int] = None