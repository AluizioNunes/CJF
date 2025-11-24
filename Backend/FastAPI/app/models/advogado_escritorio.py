from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer
from sqlalchemy.sql import quoted_name
from ..database import Base


class AdvogadoEscritorio(Base):
    __tablename__ = quoted_name("AdvogadoEscritorios", True)

    advogado_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    escritorio_id: Mapped[int] = mapped_column(Integer, primary_key=True)