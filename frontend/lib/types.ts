export type Produto = {
  id: string;
  nome: string;
};

export type Praca = {
  id: string;
  nome: string;
};

export type EstatisticasGerais = {
  preco_medio: number;
  mediana: number;
  min_preco: number;
  max_preco: number;
  total: number;
  total_pracas: number;
  variacao_percentual: number | null;
};

export type PrecoPorData = {
  data: string;
  preco_medio: number;
};

export type PrecoPorPraca = {
  praca_nome: string;
  preco_medio: number;
};

export type DadosPorPraca = {
  praca_nome: string;
  preco_medio: number;
  min_preco: number;
  max_preco: number;
};

export type VariacaoPraca = {
  praca_nome: string;
  preco_inicial: number;
  preco_final: number;
  variacao_percentual: number;
};

export type AltasQuedas = {
  maiores_altas: VariacaoPraca[];
  maiores_quedas: VariacaoPraca[];
};

export type Painel = {
  estatisticas: EstatisticasGerais;
  serie: PrecoPorData[];
  porPraca: PrecoPorPraca[];
  dadosPraca: DadosPorPraca[];
  ranking: AltasQuedas;
};

export type Filters = {
  produtoId: string | null;
  inicio: string;
  fim: string;
  pracaIds: string[] | null;
};

export type Intervalo = {
  start: string;
  end: string;
};
