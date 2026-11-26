import datetime
from decimal import Decimal
import uuid
from pydantic import BaseModel, ConfigDict

class Cotacao(BaseModel):
    id: uuid.UUID
    produto_id: uuid.UUID
    praca_id: uuid.UUID
    data: datetime.date
    preco: Decimal
    unidade: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class CotacaoEstatisticaResponse(BaseModel):
    preco_medio: Decimal
    mediana: Decimal
    min_preco: Decimal
    max_preco: Decimal
    variacao_percentual: float | None
    total: int

    model_config = ConfigDict(from_attributes=True)

