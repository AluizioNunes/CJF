from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class AuditoriaCreate(BaseModel):
    entidade: str
    entidade_id: int
    acao: str
    quem: str
    quando: Optional[datetime] = None
    diff: Optional[str] = None


class AuditoriaRead(AuditoriaCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)