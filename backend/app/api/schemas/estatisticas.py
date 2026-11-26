from datetime import date

from pydantic import BaseModel, ConfigDict


class EstatisticasGeralResponse(BaseModel):
    preco_medio: float
    mediana: float
    min_preco: float
    max_preco: float
    total: int
    total_pracas: int
    variacao_percentual: float | None


    model_config = ConfigDict(from_attributes=True)


class PrecoMedioPorDataResponse(BaseModel):
    data: date
    preco_medio: float

    model_config = ConfigDict(from_attributes=True)


class PrecoMedioPorPracaResponse(BaseModel):
    praca_nome: str
    preco_medio: float

    model_config = ConfigDict(from_attributes=True)


class DadosPorPracaResponse(BaseModel):
    praca_nome: str
    preco_medio: float
    min_preco: float
    max_preco: float

    model_config = ConfigDict(from_attributes=True)


class VariacaoPracaResponse(BaseModel):
    praca_nome: str
    preco_inicial: float
    preco_final: float
    variacao_percentual: float

    model_config = ConfigDict(from_attributes=True)


class MaioresAltasQuedasResponse(BaseModel):
    maiores_altas: list[VariacaoPracaResponse]
    maiores_quedas: list[VariacaoPracaResponse]

    model_config = ConfigDict(from_attributes=True)