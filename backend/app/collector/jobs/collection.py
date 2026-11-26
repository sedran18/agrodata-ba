
from datetime import datetime, timedelta
import logging
from time import sleep

from backend.app.collector.config.produtos import PRODUTOS
from backend.app.collector.repository import save_cotacoes
from backend.app.collector.seagri.client import fetch_page
from backend.app.collector.seagri.normalizer import normalize_data
from backend.app.collector.seagri.parser import parse_page

def collect_quotes(
    start_date: datetime, 
    end_date: datetime, 
    logger: logging.Logger,
    delay: int = 10
    ) -> None:
    """
    Coleta as cotações dos produtos configurados em PRODUTOS
    referentes às datas especificadas.

    Args:
        start_date: Data de início da coleta
        end_date: Data de fim da coleta
        logger: Logger para registrar as mensagens
    """

    logger.info(
        "Iniciando coleta: %s a %s",
        start_date.strftime("%Y-%m-%d"),
        end_date.strftime("%Y-%m-%d"),
    )

    for produto, produto_id in PRODUTOS.items():
        pagina = 0

        try:
            logger.info(
                "Iniciando coleta do produto '%s'",
                produto,
            )

            while True:
                params = {
                    "produto": produto_id,
                    "praca": "All",
                    "tipo": "All",
                    "data[min][date]": start_date.strftime("%Y-%m-%d"),
                    "data[max][date]": end_date.strftime("%Y-%m-%d"),
                }

                if pagina > 0:
                    params["page"] = pagina

                html = fetch_page(params)

                if not html:
                    break

                try:
                    df = parse_page(html)
                except ValueError as exc:
                    if "No tables found" in str(exc):
                        logger.info("Fim da paginação: %s", produto)
                        break

                    raise

                if df.empty:
                    break

                cotacoes = normalize_data(df)

                if not cotacoes:
                    break

                save_cotacoes(cotacoes)

                logger.info(
                    "Produto '%s': página %d processada, "
                    "%d registros normalizados",
                    produto,
                    pagina,
                    len(cotacoes),
                )

                pagina += 1
                sleep(delay)

            logger.info(
                "Coleta do produto '%s' finalizada",
                produto,
            )

        except Exception:
            logger.exception(
                "Falha no backfill do produto '%s', página %d",
                produto,
                pagina,
            )
            continue

    logger.info("Coleta finalizada")
