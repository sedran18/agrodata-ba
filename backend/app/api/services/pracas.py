from backend.app.api.repositories.praca import get_pracas_from_database


def get_pracas_service(limit: int | None = None, offset: int | None = None):
    pracas = get_pracas_from_database(limit, offset)

    return pracas        
