import uuid
from datetime import date

from sqlalchemy import and_, func, select

from backend.app.db.session import SessionLocal
from backend.app.models import Cotacao, Praca, ProdutoTipo
from backend.app.utils.main import _variacao_percentual

def _aplicar_filtros(stmt, produto_ids, pracas_ids, start_date, end_date):
    # Cotacao guarda produto_tipo_id; o produto é resolvido em produto_tipos.
    if produto_ids:
        tipos_do_produto = select(ProdutoTipo.id).where(
            ProdutoTipo.produto_id.in_(produto_ids)
        )
        stmt = stmt.where(Cotacao.produto_tipo_id.in_(tipos_do_produto))
    if pracas_ids:
        stmt = stmt.where(Cotacao.praca_id.in_(pracas_ids))
    if start_date is not None:
        stmt = stmt.where(Cotacao.data >= start_date)
    if end_date is not None:
        stmt = stmt.where(Cotacao.data <= end_date)
    return stmt





def get_estatisticas_geral_from_database(
    produto_ids: list[uuid.UUID] | None = None,
    pracas_ids: list[uuid.UUID] | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    with SessionLocal() as session:
        agregados = select(
            func.avg(Cotacao.preco).label("preco_medio"),
            func.percentile_cont(0.5).within_group(Cotacao.preco.asc()).label("mediana"),
            func.min(Cotacao.preco).label("min_preco"),
            func.max(Cotacao.preco).label("max_preco"),
            func.count(Cotacao.id).label("total"),
        )
        agregados = _aplicar_filtros(
            agregados, produto_ids, pracas_ids, start_date, end_date
        )
        estatisticas = dict(session.execute(agregados).mappings().one())

        if not estatisticas["total"]:
            return None

        media_por_data = func.avg(Cotacao.preco).label("media")
        medias = select(Cotacao.data, media_por_data)
        medias = _aplicar_filtros(medias, produto_ids, pracas_ids, start_date, end_date)
        medias = medias.group_by(Cotacao.data).order_by(Cotacao.data)
        rows = session.execute(medias).mappings().all()

        total_pracas = select(func.count(func.distinct(Cotacao.praca_id)))
        total_pracas = _aplicar_filtros(
            total_pracas, produto_ids, pracas_ids, start_date, end_date
        )
        estatisticas["total_pracas"] = session.execute(total_pracas).scalar_one()

        if len(rows) >= 2:
            estatisticas["variacao_percentual"] = _variacao_percentual(
                rows[0]["media"], rows[-1]["media"]
            )
        else:
            estatisticas["variacao_percentual"] = None

        return estatisticas


def get_preco_medio_por_data(
    produto_ids: list[uuid.UUID] | None = None,
    pracas_ids: list[uuid.UUID] | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    preco_medio = func.avg(Cotacao.preco).label("preco_medio")
    stmt = select(Cotacao.data, preco_medio)
    stmt = _aplicar_filtros(stmt, produto_ids, pracas_ids, start_date, end_date)
    stmt = stmt.group_by(Cotacao.data).order_by(Cotacao.data)

    with SessionLocal() as session:
        rows = session.execute(stmt).mappings().all()
        return [dict(row) for row in rows]


def get_preco_medio_por_praca(
    produto_ids: list[uuid.UUID] | None = None,
    pracas_ids: list[uuid.UUID] | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    preco_medio = func.avg(Cotacao.preco).label("preco_medio")
    stmt = select(Praca.nome.label("praca_nome"), preco_medio).join(
        Praca, Cotacao.praca_id == Praca.id
    )
    stmt = _aplicar_filtros(stmt, produto_ids, pracas_ids, start_date, end_date)
    stmt = stmt.group_by(Praca.id, Praca.nome).order_by(preco_medio)

    with SessionLocal() as session:
        rows = session.execute(stmt).mappings().all()
        return [dict(row) for row in rows]


def get_dados_por_praca(
    produto_ids: list[uuid.UUID] | None = None,
    pracas_ids: list[uuid.UUID] | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    preco_medio = func.avg(Cotacao.preco).label("preco_medio")
    stmt = select(
        Praca.nome.label("praca_nome"),
        preco_medio,
        func.min(Cotacao.preco).label("min_preco"),
        func.max(Cotacao.preco).label("max_preco"),
    ).join(Praca, Cotacao.praca_id == Praca.id)
    stmt = _aplicar_filtros(stmt, produto_ids, pracas_ids, start_date, end_date)
    stmt = stmt.group_by(Praca.id, Praca.nome).order_by(preco_medio)

    with SessionLocal() as session:
        rows = session.execute(stmt).mappings().all()
        return [dict(row) for row in rows]


def get_preco_inicial_final_por_praca(
    produto_ids: list[uuid.UUID] | None = None,
    pracas_ids: list[uuid.UUID] | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    with SessionLocal() as session:
        preco_medio = func.avg(Cotacao.preco).label("preco_medio")
        medias_diarias = select(
            Cotacao.praca_id.label("praca_id"),
            Cotacao.data.label("data"),
            preco_medio,
        )
        medias_diarias = _aplicar_filtros(
            medias_diarias, produto_ids, pracas_ids, start_date, end_date
        )
        medias_diarias = medias_diarias.group_by(
            Cotacao.praca_id, Cotacao.data
        ).cte("medias_diarias")

        data_inicial = func.min(medias_diarias.c.data).label("data_inicial")
        data_final = func.max(medias_diarias.c.data).label("data_final")
        limites = (
            select(medias_diarias.c.praca_id, data_inicial, data_final)
            .group_by(medias_diarias.c.praca_id)
            .having(data_inicial != data_final)
            .cte("limites")
        )

        serie_inicial = medias_diarias.alias("serie_inicial")
        serie_final = medias_diarias.alias("serie_final")
        stmt = (
            select(
                Praca.nome.label("praca_nome"),
                serie_inicial.c.preco_medio.label("preco_inicial"),
                serie_final.c.preco_medio.label("preco_final"),
            )
            .select_from(limites)
            .join(Praca, Praca.id == limites.c.praca_id)
            .join(
                serie_inicial,
                and_(
                    serie_inicial.c.praca_id == limites.c.praca_id,
                    serie_inicial.c.data == limites.c.data_inicial,
                ),
            )
            .join(
                serie_final,
                and_(
                    serie_final.c.praca_id == limites.c.praca_id,
                    serie_final.c.data == limites.c.data_final,
                ),
            )
        )
        rows = session.execute(stmt).mappings().all()
        return [dict(row) for row in rows]
