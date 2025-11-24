from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Text
from sqlalchemy.sql import quoted_name
from ..database import Base
from .common import BaseModelMixin


class Perfil(Base, BaseModelMixin):
    __tablename__ = quoted_name("Perfil", True)

    nome: Mapped[str] = mapped_column(String(128), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)