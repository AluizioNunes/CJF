from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer
from sqlalchemy.sql import quoted_name
from ..database import Base
from .common import BaseModelMixin


class Advogado(Base, BaseModelMixin):
    __tablename__ = quoted_name("Advogados", True)

    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    oab: Mapped[str | None] = mapped_column(String(64), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    telefone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    especialidade_id: Mapped[int | None] = mapped_column(Integer, nullable=True)