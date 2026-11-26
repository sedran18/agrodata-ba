from backend.app.api.repositories.produto import get_produtos_from_database


def get_produtos(limit: int | None = None, offset: int | None = None):
    produtos = get_produtos_from_database(limit, offset)

    if not produtos: 
        return []

    return produtos