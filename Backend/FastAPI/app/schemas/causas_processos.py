from pydantic import BaseModel, ConfigDict
from typing import Optional
from .common import UppercaseModel


class CausaProcessoBase(UppercaseModel):
    numero: str
    descricao: Optional[str] = None
    status: Optional[str] = None
    cliente_id: Optional[int] = None
    advogado_id: Optional[int] = None
    escritorio_id: Optional[int] = None
    especialidade_id: Optional[int] = None
    valor: Optional[float] = None


class CausaProcessoCreate(CausaProcessoBase):
    pass


class CausaProcessoRead(CausaProcessoBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class CausaProcessoUpdate(UppercaseModel):
    numero: Optional[str] = None
    descricao: Optional[str] = None
    status: Optional[str] = None
    cliente_id: Optional[int] = None
    advogado_id: Optional[int] = None
    escritorio_id: Optional[int] = None
    especialidade_id: Optional[int] = None
    valor: Optional[float] = None