from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer
from sqlalchemy.sql import quoted_name
from ..database import Base


class UsuarioEscritorio(Base):
    __tablename__ = quoted_name("UsuarioEscritorios", True)

    usuario_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    escritorio_id: Mapped[int] = mapped_column(Integer, primary_key=True)