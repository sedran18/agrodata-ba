
from datetime import datetime, timedelta
import logging
from backend.app.collector.jobs.collection import collect_quotes
from backend.app.core.logging_config import setup_logging

setup_logging()

logger = logging.getLogger(__name__)


def backfill_job() -> None:
    """
        Executa a coleta histórica de cotações da SEAGRI Bahia.

        Busca as cotações dos produtos configurados em PRODUTOS
        referentes aos últimos 365 dias, percorrendo as páginas
        disponíveis para cada produto.

        Os dados extraídos são interpretados, normalizados e
        persistidos no banco de dados. Cotações já existentes
        são ignoradas pelo repositório para evitar duplicações.

        Registra o início, o progresso e as falhas da coleta.
        Em caso de erro durante o processamento de um produto,
        registra a exceção e continua com o próximo produto.

        A execução aguarda 10 segundos entre as requisições
        para reduzir a frequência de acesso ao site.
    """

    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)

    collect_quotes(start_date, end_date, logger)


if __name__ == "__main__":
    backfill_job()