from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Text
from sqlalchemy.sql import quoted_name
from ..database import Base
from .common import BaseModelMixin


class Parametro(Base, BaseModelMixin):
    __tablename__ = quoted_name("Parametros", True)

    chave: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    valor: Mapped[str | None] = mapped_column(Text, nullable=True)