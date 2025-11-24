from pydantic import BaseModel, ConfigDict
from typing import Optional
from .common import UppercaseModel


class EscritorioBase(UppercaseModel):
    nome: str
    cnpj: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None


class EscritorioCreate(EscritorioBase):
    pass


class EscritorioRead(EscritorioBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class EscritorioUpdate(UppercaseModel):
    nome: Optional[str] = None
    cnpj: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None