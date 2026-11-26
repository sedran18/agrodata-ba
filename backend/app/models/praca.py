from backend.app.db.base import Base
import uuid

from sqlalchemy import String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

class Praca(Base):
    __tablename__ = 'pracas'
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
