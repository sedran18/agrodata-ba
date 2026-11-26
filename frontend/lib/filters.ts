import { isoToday, shiftIso } from "@/lib/format";
import type { Filters, Intervalo, Praca, Produto } from "@/lib/types";

export function defaultFilters(
  _produtos: Produto[],
  _pracas: Praca[],
  intervalo: Intervalo | null,
): Filters {
  const fim = intervalo?.end ?? isoToday();
  const inicioCalculado = shiftIso(fim, -29);
  const inicio = intervalo && inicioCalculado < intervalo.start ? intervalo.start : inicioCalculado;

  return {
    produtoId: null,
    inicio,
    fim,
    pracaIds: null,
  };
}

export function validateFilters(
  filters: Filters,
  produtos: Produto[],
  pracas: Praca[],
  intervalo: Intervalo | null,
): string | null {
  if (filters.produtoId && !produtos.some((produto) => produto.id === filters.produtoId)) {
    return "Selecione um produto válido.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(filters.inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(filters.fim)) {
    return "Selecione datas válidas.";
  }
  if (filters.inicio > filters.fim) {
    return "A data inicial deve ser anterior ou igual à data final.";
  }
  if (filters.fim > isoToday()) {
    return "Não é possível selecionar datas futuras.";
  }
  if (intervalo && (filters.inicio < intervalo.start || filters.fim > intervalo.end)) {
    return "Selecione um período dentro das datas disponíveis.";
  }
  if (filters.pracaIds && !filters.pracaIds.length) {
    return "Selecione pelo menos uma praça.";
  }
  if (filters.pracaIds?.some((id) => !pracas.some((praca) => praca.id === id))) {
    return "Selecione praças válidas.";
  }
  return null;
}

export function filtersFromSearch(
  search: string,
  produtos: Produto[],
  pracas: Praca[],
  intervalo: Intervalo | null,
): { filters: Filters; error: string | null } {
  const defaults = defaultFilters(produtos, pracas, intervalo);
  const params = new URLSearchParams(search);
  const produtoParam = params.get("produto");
  const pracasParam = params.get("pracas");
  const filters: Filters = {
    produtoId: !produtoParam || produtoParam === "todos" ? null : produtoParam,
    inicio: params.get("inicio") ?? defaults.inicio,
    fim: params.get("fim") ?? defaults.fim,
    pracaIds: pracasParam === null || pracasParam === "todas" ? null : pracasParam.split(",").filter(Boolean),
  };
  const error = validateFilters(filters, produtos, pracas, intervalo);
  return { filters: error ? defaults : filters, error };
}

export function filtersToQuery(filters: Filters) {
  const params = new URLSearchParams({
    inicio: filters.inicio,
    fim: filters.fim,
  });
  if (filters.produtoId) params.set("produto", filters.produtoId);
  if (filters.pracaIds) params.set("pracas", filters.pracaIds.join(","));
  return params.toString();
}
