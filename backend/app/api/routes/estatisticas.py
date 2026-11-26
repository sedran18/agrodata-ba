from datetime import date
import uuid
from fastapi import APIRouter, Query

from backend.app.api.schemas.estatisticas import (
    DadosPorPracaResponse,
    EstatisticasGeralResponse,
    MaioresAltasQuedasResponse,
    PrecoMedioPorDataResponse,
    PrecoMedioPorPracaResponse,
)
from backend.app.api.services.estatisticas import (
    get_dados_por_praca,
    get_estatisticas_geral,
    get_maiores_altas_e_maiores_quedas,
    get_preco_medio_por_data,
    get_preco_medio_por_praca,
)


router = APIRouter(
    prefix="/estatisticas",
    tags=["estatisticas"],
)


@router.get("/", response_model=EstatisticasGeralResponse)
def get_estatisticas_route(
    produto_ids: list[uuid.UUID] | None = Query(None),
    pracas_ids: list[uuid.UUID] | None = Query(None),
    start_date: date | None = None,
    end_date: date | None = None,
):
    return get_estatisticas_geral(produto_ids, pracas_ids, start_date, end_date)


@router.get("/preco-medio-por-data", response_model=list[PrecoMedioPorDataResponse])
def get_preco_medio_por_data_route(
    produto_ids: list[uuid.UUID] | None = Query(None),
    pracas_ids: list[uuid.UUID] | None = Query(None),
    start_date: date | None = None,
    end_date: date | None = None,
):
    return get_preco_medio_por_data(produto_ids, pracas_ids, start_date, end_date)


@router.get("/preco-medio-por-praca", response_model=list[PrecoMedioPorPracaResponse])
def get_preco_medio_por_praca_route(
    produto_ids: list[uuid.UUID] | None = Query(None),
    pracas_ids: list[uuid.UUID] | None = Query(None),
    start_date: date | None = None,
    end_date: date | None = None,
):
    return get_preco_medio_por_praca(produto_ids, pracas_ids, start_date, end_date)


@router.get("/dados-por-praca", response_model=list[DadosPorPracaResponse])
def get_dados_por_praca_route(
    produto_ids: list[uuid.UUID] | None = Query(None),
    pracas_ids: list[uuid.UUID] | None = Query(None),
    start_date: date | None = None,
    end_date: date | None = None,
):
    return get_dados_por_praca(produto_ids, pracas_ids, start_date, end_date)


@router.get("/maiores-altas-e-quedas", response_model=MaioresAltasQuedasResponse)
def get_maiores_altas_e_maiores_quedas_route(
    produto_ids: list[uuid.UUID] | None = Query(None),
    pracas_ids: list[uuid.UUID] | None = Query(None),
    start_date: date | None = None,
    end_date: date | None = None,
):
    return get_maiores_altas_e_maiores_quedas(
        produto_ids, pracas_ids, start_date, end_date
    )
