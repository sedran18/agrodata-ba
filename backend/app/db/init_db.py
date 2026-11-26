from sqlalchemy import text
from .base import Base
from .session import engine

from backend.app.models import Praca, ProdutoTipo, Produto, Cotacao

def drop_tables():
    Base.metadata.drop_all(bind=engine)
    print("Tabelas removidas com sucesso")

def create_tables():
    with engine.begin() as conn:
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS cotacoes"))
        Base.metadata.create_all(bind=conn)
        print("Tabelas criadas com sucesso")


if __name__ == "__main__":
    create_tables()
