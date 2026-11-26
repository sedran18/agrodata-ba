from datetime import date
import uuid
from fastapi import APIRouter, Query

from backend.app.api.schemas.cotacao import CotacaoEstatisticaResponse
from backend.app.api.services.cotacao import get_cotacoes_estatisticas

router  = APIRouter(
    prefix="/cotacoes",
    tags=["cotacoes"]
)

@router.get('/estatisticas', response_model=CotacaoEstatisticaResponse)
def get_cotacoes_estatisticas_route(
    produto_id: uuid.UUID,
    pracas_ids: list[uuid.UUID] | None = Query(None),
    start_date: date | None = None,
    end_date: date | None = None
):
    return get_cotacoes_estatisticas(produto_id=produto_id, pracas_ids=pracas_ids, start_date=start_date, end_date=end_date)