import type {
  AltasQuedas,
  DadosPorPraca,
  EstatisticasGerais,
  Filters,
  Intervalo,
  Painel,
  Praca,
  PrecoPorData,
  PrecoPorPraca,
  Produto,
} from "@/lib/types";

const proxyBase = "/agro-api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function asNumber(value: unknown, field: string) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) {
    throw new ApiError(`A API retornou um valor inválido em ${field}.`, 502);
  }
  return number;
}

function asNumberOrNull(value: unknown, field: string) {
  if (value === null || value === undefined) return null;
  return asNumber(value, field);
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object") {
    throw new ApiError("A API retornou uma resposta inesperada.", 502);
  }
  return value as Record<string, unknown>;
}

async function request(path: string, params?: URLSearchParams, signal?: AbortSignal) {
  const query = params?.toString();
  const response = await fetch(query ? `${proxyBase}${path}?${query}` : `${proxyBase}${path}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    let detail = "Não foi possível carregar os dados da API.";
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      detail = "Não foi possível carregar os dados da API.";
    }
    throw new ApiError(detail, response.status);
  }

  return response.json();
}

function filtrosParams(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.produtoId) params.append("produto_ids", filters.produtoId);
  for (const pracaId of filters.pracaIds ?? []) params.append("pracas_ids", pracaId);
  params.set("start_date", filters.inicio);
  params.set("end_date", filters.fim);
  return params;
}

export async function getProdutos(signal?: AbortSignal): Promise<Produto[]> {
  const body = await request("/produtos/", undefined, signal);
  if (!Array.isArray(body)) return [];
  return body.map((item) => {
    const row = asRecord(item);
    return { id: String(row.id), nome: String(row.nome) };
  });
}

export async function getPracas(signal?: AbortSignal): Promise<Praca[]> {
  const body = await request("/pracas/", undefined, signal);
  if (!Array.isArray(body)) return [];
  return body.map((item) => {
    const row = asRecord(item);
    return { id: String(row.id), nome: String(row.nome) };
  });
}

export async function getIntervalo(signal?: AbortSignal): Promise<Intervalo | null> {
  const body = await request("/estatisticas/preco-medio-por-data", undefined, signal);
  if (!Array.isArray(body) || body.length === 0) return null;
  const first = asRecord(body[0]);
  const last = asRecord(body[body.length - 1]);
  return { start: String(first.data), end: String(last.data) };
}

function parseEstatisticas(body: unknown): EstatisticasGerais {
  const row = asRecord(body);
  return {
    preco_medio: asNumber(row.preco_medio, "preco_medio"),
    mediana: asNumber(row.mediana, "mediana"),
    min_preco: asNumber(row.min_preco, "min_preco"),
    max_preco: asNumber(row.max_preco, "max_preco"),
    total: asNumber(row.total, "total"),
    total_pracas: asNumber(row.total_pracas, "total_pracas"),
    variacao_percentual: asNumberOrNull(row.variacao_percentual, "variacao_percentual"),
  };
}

function parseSerie(body: unknown): PrecoPorData[] {
  if (!Array.isArray(body)) return [];
  return body.map((item) => {
    const row = asRecord(item);
    return { data: String(row.data), preco_medio: asNumber(row.preco_medio, "preco_medio") };
  });
}

function parsePorPraca(body: unknown): PrecoPorPraca[] {
  if (!Array.isArray(body)) return [];
  return body.map((item) => {
    const row = asRecord(item);
    return {
      praca_nome: String(row.praca_nome),
      preco_medio: asNumber(row.preco_medio, "preco_medio"),
    };
  });
}

function parseDadosPraca(body: unknown): DadosPorPraca[] {
  if (!Array.isArray(body)) return [];
  return body.map((item) => {
    const row = asRecord(item);
    return {
      praca_nome: String(row.praca_nome),
      preco_medio: asNumber(row.preco_medio, "preco_medio"),
      min_preco: asNumber(row.min_preco, "min_preco"),
      max_preco: asNumber(row.max_preco, "max_preco"),
    };
  });
}

function parseVariacoes(body: unknown) {
  if (!Array.isArray(body)) return [];
  return body.map((item) => {
    const row = asRecord(item);
    return {
      praca_nome: String(row.praca_nome),
      preco_inicial: asNumber(row.preco_inicial, "preco_inicial"),
      preco_final: asNumber(row.preco_final, "preco_final"),
      variacao_percentual: asNumber(row.variacao_percentual, "variacao_percentual"),
    };
  });
}

function parseRanking(body: unknown): AltasQuedas {
  const row = asRecord(body);
  return {
    maiores_altas: parseVariacoes(row.maiores_altas),
    maiores_quedas: parseVariacoes(row.maiores_quedas),
  };
}

export async function getPainel(filters: Filters, signal?: AbortSignal): Promise<Painel | null> {
  const params = filtrosParams(filters);
  const [estatisticas, serie, porPraca, dadosPraca, ranking] = await Promise.all([
    request("/estatisticas/", params, signal),
    request("/estatisticas/preco-medio-por-data", params, signal),
    request("/estatisticas/preco-medio-por-praca", params, signal),
    request("/estatisticas/dados-por-praca", params, signal),
    request("/estatisticas/maiores-altas-e-quedas", params, signal),
  ]);

  if (!estatisticas) return null;

  return {
    estatisticas: parseEstatisticas(estatisticas),
    serie: parseSerie(serie),
    porPraca: parsePorPraca(porPraca),
    dadosPraca: parseDadosPraca(dadosPraca),
    ranking: parseRanking(ranking ?? { maiores_altas: [], maiores_quedas: [] }),
  };
}
