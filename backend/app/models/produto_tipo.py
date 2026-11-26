import uuid

from backend.app.db.base import Base
from sqlalchemy import ForeignKey, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column

class ProdutoTipo(Base):
    __tablename__ = 'produto_tipos'

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4
    )

    nome: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    produto_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey('cotacoes.produtos.id'),
        nullable=False
    )

    __table_args__  = (
        UniqueConstraint('nome', 'produto_id', name='uq_nome_produto_id'),
        {"schema": "cotacoes"},
    )