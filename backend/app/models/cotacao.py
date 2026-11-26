import datetime
import uuid

from backend.app.db.base import Base
from sqlalchemy import Date, DateTime, ForeignKey, String, Uuid, UniqueConstraint, DECIMAL
from sqlalchemy.orm import Mapped, mapped_column
from datetime import date

class Cotacao(Base):
    __tablename__ = 'cotacoes'

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4
    )

    data: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    preco: Mapped[float] = mapped_column(
        DECIMAL(10, 2),
        nullable=False
    )

    unidade: Mapped[str] = mapped_column(
        String(20), 
        nullable=False
    )

    praca_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey('cotacoes.pracas.id'),
        nullable=False
    )

    produto_tipo_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey('cotacoes.produto_tipos.id'),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.datetime.now
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.datetime.now
    )

    __table_args__ = (
        UniqueConstraint('data', 'praca_id', 'produto_tipo_id', name='uq_data_praca_produto_tipo'),
        {"schema": "cotacoes"},
    )




