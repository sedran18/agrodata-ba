import pandas as pd
from io import StringIO

def parse_page(html: str) -> pd.DataFrame:
    tabelas = pd.read_html(StringIO(html), flavor='lxml')

    if not tabelas:
        raise ValueError("Nenhuma tabela encontrada no HTML")

    return tabelas[0]
        



