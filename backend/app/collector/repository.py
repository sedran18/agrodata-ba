from datetime import date, timedelta
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert

from backend.app.db.session import SessionLocal
from backend.app.models import Cotacao, Praca, Produto, ProdutoTipo

def save_cotacoes(cotacoes: list[dict]) -> None:
    """
    Salva uma lista de cotações já normalizadas no banco de dados.
    Lança ValueError se houver algum dado ausente inesperado.
    """
    if not isinstance(cotacoes, list):
        raise ValueError("O parâmetro 'cotacoes' deve ser uma lista de dicionários.")

    with SessionLocal() as session:
        # Caches em memória para evitar consultas repetidas ao database
        pracas_cache = {}
        produtos_cache = {}
        tipos_cache = {}

        for index, cotacao in enumerate(cotacoes):
            praca = cotacao.get('praca')
            produto = cotacao.get('produto')
            tipo_produto = cotacao.get('tipo')
            data_cotacao = cotacao.get('data')
            preco = cotacao.get('preco')
            unidade = cotacao.get('unidade')

            if not all([praca, produto, tipo_produto, data_cotacao, unidade]) or preco is None:
                raise ValueError(f"Dados incompletos encontrados no item {index}: {cotacao}")

            # praça
            if praca not in pracas_cache:
                stmt = select(Praca).where(Praca.nome == praca)
                praca_obj = session.scalars(stmt).one_or_none()
                
                if praca_obj is None:
                    praca_obj = Praca(nome=praca)
                    session.add(praca_obj)
                    session.flush()
                
                pracas_cache[praca] = praca_obj.id
            
            praca_id = pracas_cache[praca]

            # produto 
            if produto not in produtos_cache:
                stmt = select(Produto).where(Produto.nome == produto)
                produto_obj = session.scalars(stmt).one_or_none()
                
                if produto_obj is None:
                    produto_obj = Produto(nome=produto)
                    session.add(produto_obj)
                    session.flush()
                
                produtos_cache[produto] = produto_obj.id
            
            produto_id = produtos_cache[produto]

            # tipo do Produto 
            tipo_key = (produto_id, tipo_produto)
            if tipo_key not in tipos_cache:
                stmt = select(ProdutoTipo).where(
                    ProdutoTipo.nome == tipo_produto, 
                    ProdutoTipo.produto_id == produto_id
                )
                tipo_produto_obj = session.scalars(stmt).one_or_none()
                
                if tipo_produto_obj is None:
                    tipo_produto_obj = ProdutoTipo(nome=tipo_produto, produto_id=produto_id)
                    session.add(tipo_produto_obj)
                    session.flush()
                
                tipos_cache[tipo_key] = tipo_produto_obj.id
            
            tipo_produto_id = tipos_cache[tipo_key]

            # inserindo cotação
            stmt = insert(Cotacao).values(
                praca_id=praca_id,
                produto_tipo_id=tipo_produto_id,
                preco=preco,
                unidade=unidade,
                data=data_cotacao,
            ).on_conflict_do_nothing(
                constraint="uq_data_praca_produto_tipo"
            )

            session.execute(stmt)
        session.commit()


def delete_first_month_cotacoes() -> None:
    """
    Deleta as cotações do primeiro mês do banco de dados.
    """
    with SessionLocal() as session:
        stmt = (
            select(Cotacao.data)
            .order_by(Cotacao.data.asc())
            .limit(1)
        )

        first_cotacao_date = session.scalars(stmt).first()

        if first_cotacao_date is None:
            return

        end_date = first_cotacao_date + timedelta(days=30)

        stmt = delete(Cotacao).where(
            Cotacao.data >= first_cotacao_date,
            Cotacao.data <= end_date,
        )

        session.execute(stmt)
        session.commit()