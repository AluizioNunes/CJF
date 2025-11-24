from pydantic import BaseModel, ConfigDict
from typing import Optional
from .common import UppercaseModel


class ParametroBase(UppercaseModel):
    chave: str
    valor: Optional[str] = None


class ParametroCreate(ParametroBase):
    pass


class ParametroRead(ParametroBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class ParametroUpdate(UppercaseModel):
    chave: Optional[str] = None
    valor: Optional[str] = None