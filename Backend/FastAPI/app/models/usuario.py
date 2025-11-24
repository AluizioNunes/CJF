from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Text, Integer
from sqlalchemy.sql import quoted_name
from ..database import Base
from .common import BaseModelMixin


class Usuario(Base, BaseModelMixin):
    __tablename__ = quoted_name("Usuarios", True)

    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str | None] = mapped_column(String(64), nullable=True)
    senha_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    permissoes: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON serializado
    advogado_id: Mapped[int | None] = mapped_column(Integer, nullable=True)