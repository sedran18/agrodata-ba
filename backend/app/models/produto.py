import uuid

from backend.app.db.base import Base
from sqlalchemy import String, Uuid, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column


class Produto(Base):
    __tablename__ = 'produtos'
    __table_args__ = {"schema": "cotacoes"}


    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, 
        primary_key=True, 
        default=uuid.uuid4
    )

    nome: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True
    )


