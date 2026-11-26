from datetime import date
import uuid

from backend.app.api.services.estatisticas import get_estatisticas_geral


def get_cotacoes_estatisticas(
    produto_id: uuid.UUID,
    pracas_ids: list[uuid.UUID] | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    return get_estatisticas_geral([produto_id], pracas_ids, start_date, end_date)