from sqlalchemy import select

from backend.app.db.session import SessionLocal
from backend.app.models import Produto

def get_produtos_from_database(limit: int | None = None, offset: int | None = None) -> list[Produto]:
    with SessionLocal() as session:
        stmt = select(Produto).limit(limit).offset(offset)
        produtos = session.scalars(stmt).all()
        
        if not produtos:
            return []
        
        return produtos
        
