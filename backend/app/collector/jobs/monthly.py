import logging
from backend.app.collector.repository import delete_first_month_cotacoes
from backend.app.core.logging_config import setup_logging

setup_logging()
logger = logging.getLogger(__name__)

def monthly_job() -> None:
    """
    Executa a tarefa mensal de manutenção das cotações.

    Remove do banco de dados as cotações referentes ao
    primeiro período mensal disponível, conforme a regra
    implementada em delete_first_month_cotacoes().

    As exceções são propagadas para o chamador, que fica
    responsável pelo tratamento e registro dos erros.
    """
    logger.info("Iniciando a tarefa mensal de manutenção das cotações")
    delete_first_month_cotacoes()
    logger.info("Tarefa mensal de manutenção das cotações finalizada")


if __name__ == "__main__":
    monthly_job()
