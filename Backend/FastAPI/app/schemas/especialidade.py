from pydantic import BaseModel, ConfigDict
from typing import Optional
from .common import UppercaseModel


class EspecialidadeBase(UppercaseModel):
    nome: str
    descricao: Optional[str] = None


class EspecialidadeCreate(EspecialidadeBase):
    pass


class EspecialidadeRead(EspecialidadeBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class EspecialidadeUpdate(UppercaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None