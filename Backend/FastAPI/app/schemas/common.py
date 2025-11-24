from pydantic import BaseModel, field_validator
from typing import Any


class UppercaseModel(BaseModel):
    @field_validator('*', mode='before')
    @classmethod
    def uppercase_strings(cls, v: Any, info):
        if isinstance(v, str) and info.field_name.lower() != 'email':
            return v.upper()
        return v