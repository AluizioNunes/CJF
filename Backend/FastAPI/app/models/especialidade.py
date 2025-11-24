from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Text
from sqlalchemy.sql import quoted_name
from ..database import Base
from .common import BaseModelMixin


class Especialidade(Base, BaseModelMixin):
    __tablename__ = quoted_name("Especialidades", True)

    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)