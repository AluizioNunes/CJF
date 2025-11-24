from pydantic import BaseModel
from pydantic import ConfigDict
from typing import Optional


class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float


class ItemCreate(ItemBase):
    pass


class ItemRead(ItemBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None