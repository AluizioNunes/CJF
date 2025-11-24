from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String
from sqlalchemy.sql import quoted_name
from ..database import Base
from .common import BaseModelMixin


class Cliente(Base, BaseModelMixin):
    __tablename__ = quoted_name("Clientes", True)

    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    cpf_cnpj: Mapped[str | None] = mapped_column(String(32), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    telefone: Mapped[str | None] = mapped_column(String(64), nullable=True)