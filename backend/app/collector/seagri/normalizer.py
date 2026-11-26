import pandas as pd
from backend.app.utils import df_col_strip, filter_currency_format

def normalize_data(df: pd.DataFrame) -> list[dict]:
    df = df.copy()

    if len(df.columns) != 6:
        raise ValueError(f"Esperadas 6 colunas, recebidas {len(df.columns)}")

    df.columns = ['data', 'produto', 'praca', 'tipo', 'unidade', 'preco']

    df["preco"] = pd.to_numeric(df["preco"], errors="coerce")
    
    df = df.dropna(subset=["preco"])

    df['data'] = pd.to_datetime(df_col_strip(df['data']), format='%d/%m/%Y').dt.date
    df['produto'] = df_col_strip(df['produto']).str.lower()
    df['praca'] = df_col_strip(df['praca']).str.lower()
    df['tipo'] = df_col_strip(df['tipo']).str.lower()
    df['unidade'] = df_col_strip(df['unidade']).str.lower()

    return df.to_dict(orient='records')
