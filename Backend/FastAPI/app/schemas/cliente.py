from pydantic import BaseModel, ConfigDict
from typing import Optional
from .common import UppercaseModel


class ClienteBase(UppercaseModel):
    nome: str
    cpf_cnpj: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None


class ClienteCreate(ClienteBase):
    pass


class ClienteRead(ClienteBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class ClienteUpdate(UppercaseModel):
    nome: Optional[str] = None
    cpf_cnpj: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None