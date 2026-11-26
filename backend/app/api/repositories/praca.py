from sqlalchemy import select
from backend.app.db.session import SessionLocal
from backend.app.models import Praca


def get_pracas_from_database(limit: int | None = None, offset: int | None = None) -> list[Praca]:
    with SessionLocal() as session:
        stmt = select(Praca).limit(limit).offset(offset)

        pracas = session.scalars(stmt).all()

        if not pracas:
            return []
        
        return pracas
        
        
