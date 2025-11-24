from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer


class BaseModelMixin:
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)