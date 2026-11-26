import pandas as pd

def df_col_strip(coluna: pd.Series) -> pd.Series:
    return coluna.str.strip()

def filter_currency_format(coluna: pd.Series) -> pd.Series:
    coluna = (
        coluna
        .str.replace('R$', '', regex=False)
        .str.replace('.', '', regex=False)
        .str.replace(',', '.', regex=False)
        .str.strip()
    )

    coluna = pd.to_numeric(coluna, errors='coerce')
    return coluna.dropna()

def _variacao_percentual(preco_inicial, preco_final):
    if preco_inicial is None or preco_final is None or preco_inicial == 0:
        return None
    variacao = (preco_final - preco_inicial) / preco_inicial * 100
    return round(float(variacao), 2)