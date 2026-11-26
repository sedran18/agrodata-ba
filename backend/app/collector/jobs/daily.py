
import logging
from datetime import datetime, timedelta

from backend.app.collector.jobs.collection import collect_quotes
from backend.app.core.logging_config import setup_logging

setup_logging()
logger = logging.getLogger(__name__)


def daily_job() -> None:
    """
    Executa a coleta diária de cotações da SEAGRI Bahia.

    Consulta as cotações dos produtos configurados em PRODUTOS
    referentes às últimas 24 horas. Os dados obtidos são
    interpretados, normalizados e salvos no banco de dados.

    Cotações já existentes são ignoradas pelo repositório,
    evitando duplicações durante execuções recorrentes.

    Registra as falhas por produto e continua o processamento
    dos demais produtos quando ocorre um erro.
    """
    end_date = datetime.now()
    start_date = end_date - timedelta(hours=24)

    collect_quotes(start_date, end_date, logger)

if __name__ == "__main__":
    daily_job()

