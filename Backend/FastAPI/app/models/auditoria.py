from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Text, Integer, DateTime
from sqlalchemy.sql import quoted_name
from datetime import datetime
from ..database import Base
from .common import BaseModelMixin


class Auditoria(Base, BaseModelMixin):
    __tablename__ = quoted_name("Auditoria", True)

    entidade: Mapped[str] = mapped_column(String(128), nullable=False)
    entidade_id: Mapped[int] = mapped_column(Integer, nullable=False)
    acao: Mapped[str] = mapped_column(String(32), nullable=False)  # create|update|delete
    quem: Mapped[str] = mapped_column(String(128), nullable=False)
    quando: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    diff: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON antes/depois