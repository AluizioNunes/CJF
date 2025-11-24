from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from .escritorio import EscritorioRead
from .common import UppercaseModel


class AdvogadoBase(UppercaseModel):
    nome: str
    oab: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    especialidade_id: Optional[int] = None


class AdvogadoCreate(AdvogadoBase):
    escritorios_ids: Optional[List[int]] = None


class AdvogadoRead(AdvogadoBase):
    id: int
    escritorios_ids: Optional[List[int]] = None
    escritorios: Optional[List[EscritorioRead]] = None
    model_config = ConfigDict(from_attributes=True)


class AdvogadoUpdate(UppercaseModel):
    nome: Optional[str] = None
    oab: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    especialidade_id: Optional[int] = None
    escritorios_ids: Optional[List[int]] = None