from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Text
from sqlalchemy.sql import quoted_name
from ..database import Base
from .common import BaseModelMixin


class Permissao(Base, BaseModelMixin):
    __tablename__ = quoted_name("Permissoes", True)

    nome: Mapped[str] = mapped_column(String(128), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)