from datetime import date
import uuid

from fastapi import HTTPException

from backend.app.api.repositories import estatisticas as estatisticas_repository
from backend.app.utils.main import _variacao_percentual


def get_estatisticas_geral(
    produto_ids: list[uuid.UUID] | None = None,
    pracas_ids: list[uuid.UUID] | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    estatisticas = estatisticas_repository.get_estatisticas_geral_from_database(
        produto_ids, pracas_ids, start_date, end_date
    )
    if not estatisticas:
        raise HTTPException(status_code=404, detail="Nenhuma cotação encontrada")
    return estatisticas


def get_preco_medio_por_data(
    produto_ids: list[uuid.UUID] | None = None,
    pracas_ids: list[uuid.UUID] | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    return estatisticas_repository.get_preco_medio_por_data(
        produto_ids, pracas_ids, start_date, end_date
    )


def get_preco_medio_por_praca(
    produto_ids: list[uuid.UUID] | None = None,
    pracas_ids: list[uuid.UUID] | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    return estatisticas_repository.get_preco_medio_por_praca(
        produto_ids, pracas_ids, start_date, end_date
    )


def get_dados_por_praca(
    produto_ids: list[uuid.UUID] | None = None,
    pracas_ids: list[uuid.UUID] | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    return estatisticas_repository.get_dados_por_praca(
        produto_ids, pracas_ids, start_date, end_date
    )


def get_maiores_altas_e_maiores_quedas(
    produto_ids: list[uuid.UUID] | None = None,
    pracas_ids: list[uuid.UUID] | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    rows = estatisticas_repository.get_preco_inicial_final_por_praca(
        produto_ids, pracas_ids, start_date, end_date
    )

    series = []
    for row in rows:
        variacao = _variacao_percentual(row["preco_inicial"], row["preco_final"])
        if variacao is None or variacao == 0:
            continue
        series.append(
            {
                "praca_nome": row["praca_nome"],
                "preco_inicial": round(float(row["preco_inicial"]), 2),
                "preco_final": round(float(row["preco_final"]), 2),
                "variacao_percentual": variacao,
            }
        )

    maiores_altas = sorted(
        (item for item in series if item["variacao_percentual"] > 0),
        key=lambda item: item["variacao_percentual"],
        reverse=True,
    )[:5]
    maiores_quedas = sorted(
        (item for item in series if item["variacao_percentual"] < 0),
        key=lambda item: item["variacao_percentual"],
    )[:5]

    return {
        "maiores_altas": maiores_altas,
        "maiores_quedas": maiores_quedas,
    }
