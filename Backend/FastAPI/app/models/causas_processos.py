from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, Text, Numeric, Date
from datetime import date
from sqlalchemy.sql import quoted_name
from ..database import Base
from .common import BaseModelMixin


class CausaProcesso(Base, BaseModelMixin):
    __tablename__ = quoted_name("CausasProcessos", True)

    numero: Mapped[str] = mapped_column(String(128), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str | None] = mapped_column(String(64), nullable=True)
    cliente_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    advogado_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    escritorio_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    especialidade_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dataDistribuicao: Mapped[date | None] = mapped_column("datadistribuicao", Date, nullable=True)
    valor: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)