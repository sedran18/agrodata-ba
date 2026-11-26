"use client";

import { useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChartNoAxesColumn,
  CircleDollarSign,
  Layers,
  MapPin,
  RotateCcw,
  SearchX,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { fullDate, money, percent, placeName } from "@/lib/format";
import type { AltasQuedas, DadosPorPraca, EstatisticasGerais, Filters } from "@/lib/types";

export function ChangeBadge({ value }: { value: number | null }) {
  return (
    <span className={`change-badge ${value !== null && value < 0 ? "negative" : ""}`}>
      {value !== null && (value >= 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
      {percent(value)}
    </span>
  );
}

function KpiCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: ReactNode;
  detail: ReactNode;
  icon: ReactNode;
}) {
  return (
    <article className="panel kpi">
      <div className="kpi-label">
        <span>{label}</span>
        {icon}
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-detail">{detail}</div>
    </article>
  );
}

export function KpiGrid({ data }: { data: EstatisticasGerais }) {
  const variationClass = data.variacao_percentual !== null && data.variacao_percentual < 0 ? "text-negative" : "text-positive";

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <KpiCard label="Preço médio" value={money(data.preco_medio)} detail="no período selecionado" icon={<CircleDollarSign className="size-3.5" />} />
      <KpiCard label="Mediana" value={money(data.mediana)} detail="no período selecionado" icon={<ChartNoAxesColumn className="size-3.5" />} />
      <KpiCard label="Menor preço" value={money(data.min_preco)} detail="cotação mais baixa do período" icon={<TrendingDown className="size-3.5" />} />
      <KpiCard label="Maior preço" value={money(data.max_preco)} detail="cotação mais alta do período" icon={<TrendingUp className="size-3.5" />} />
      <KpiCard
        label="Variação no período"
        value={
          <span className={`flex items-center gap-1 ${variationClass}`}>
            {data.variacao_percentual !== null && (data.variacao_percentual >= 0 ? <ArrowUp className="size-5" /> : <ArrowDown className="size-5" />)}
            {percent(data.variacao_percentual)}
          </span>
        }
        detail="entre a primeira e a última data com cotação"
        icon={<TrendingUp className="size-3.5" />}
      />
      <KpiCard
        label="Praças e amostras"
        value={
          <>
            {data.total_pracas}
            <span className="ml-1 text-xs font-normal text-muted-foreground">praças</span>
          </>
        }
        detail={`${data.total.toLocaleString("pt-BR")} cotações no período`}
        icon={<Layers className="size-3.5" />}
      />
    </div>
  );
}

type SortKey = keyof DadosPorPraca;

export function PracaTable({ data }: { data: DadosPorPraca[] }) {
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "preco_medio", desc: true });
  const sorted = [...data].sort((a, b) => {
    const left = a[sort.key];
    const right = b[sort.key];
    const result = typeof left === "string" && typeof right === "string"
      ? left.localeCompare(right, "pt-BR")
      : Number(left) - Number(right);
    return result * (sort.desc ? -1 : 1);
  });
  const columns: { key: SortKey; label: string }[] = [
    { key: "praca_nome", label: "Praça" },
    { key: "preco_medio", label: "Preço médio" },
    { key: "min_preco", label: "Mínimo" },
    { key: "max_preco", label: "Máximo" },
  ];

  return (
    <section className="panel overflow-hidden">
      <div className="chart-header pb-5">
        <div>
          <h3 className="chart-title">Preços por praça</h3>
          <p className="chart-subtitle">Média, mínimo e máximo no período</p>
        </div>
        <span className="rounded-md bg-secondary px-2 py-1 text-[10px] text-muted-foreground">{data.length} praças</span>
      </div>
      <div className="table-scroller">
        <table className="price-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} aria-sort={sort.key === column.key ? (sort.desc ? "descending" : "ascending") : "none"}>
                  <button
                    type="button"
                    className="table-sort"
                    onClick={() => setSort({ key: column.key, desc: sort.key === column.key ? !sort.desc : false })}
                  >
                    {column.label}
                    <ArrowUpDown className="size-3" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.praca_nome}>
                <td>
                  <span className="flex items-center gap-2">
                    <MapPin className="size-3 text-muted-foreground" />
                    {placeName(row.praca_nome)}
                  </span>
                </td>
                <td className="font-semibold">{money(row.preco_medio)}</td>
                <td>{money(row.min_preco)}</td>
                <td>{money(row.max_preco)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function RankingList({
  ranking,
  onSelect,
}: {
  ranking: AltasQuedas;
  onSelect: (pracaNome: string) => void;
}) {
  return (
    <section className="panel overflow-hidden">
      <div className="chart-header pb-5">
        <div>
          <h3 className="chart-title">Movimentações do mercado</h3>
          <p className="chart-subtitle">Praças com maior variação entre a primeira e a última data</p>
        </div>
        <TrendingUp className="size-4 text-muted-foreground" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <div className="border-t sm:border-r">
          <h4 className="flex items-center gap-1.5 px-6 py-3 text-[11px] font-medium text-positive">
            <TrendingUp className="size-3.5" />
            Maiores altas
          </h4>
          {ranking.maiores_altas.map((item, index) => (
            <button type="button" className="ranking-row" key={item.praca_nome} onClick={() => onSelect(item.praca_nome)}>
              <span className="flex items-center">
                <span className="rank-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="text-left">
                  <span className="block text-[11px] font-medium">{placeName(item.praca_nome)}</span>
                  <span className="text-[9px] font-normal text-muted-foreground">
                    {money(item.preco_inicial)} → {money(item.preco_final)}
                  </span>
                </span>
              </span>
              <ChangeBadge value={item.variacao_percentual} />
            </button>
          ))}
          {ranking.maiores_altas.length === 0 && <p className="p-6 text-xs text-muted-foreground">Nenhuma alta no período.</p>}
        </div>
        <div className="border-t">
          <h4 className="flex items-center gap-1.5 px-6 py-3 text-[11px] font-medium text-negative">
            <TrendingDown className="size-3.5" />
            Maiores quedas
          </h4>
          {ranking.maiores_quedas.map((item, index) => (
            <button type="button" className="ranking-row" key={item.praca_nome} onClick={() => onSelect(item.praca_nome)}>
              <span className="flex items-center">
                <span className="rank-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="text-left">
                  <span className="block text-[11px] font-medium">{placeName(item.praca_nome)}</span>
                  <span className="text-[9px] font-normal text-muted-foreground">
                    {money(item.preco_inicial)} → {money(item.preco_final)}
                  </span>
                </span>
              </span>
              <ChangeBadge value={item.variacao_percentual} />
            </button>
          ))}
          {ranking.maiores_quedas.length === 0 && <p className="p-6 text-xs text-muted-foreground">Nenhuma queda no período.</p>}
        </div>
      </div>
    </section>
  );
}

export function LoadingState() {
  return (
    <div aria-label="Carregando cotações" aria-busy="true">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="panel kpi" key={index}>
            <div className="skeleton h-3 w-24" />
            <div className="skeleton mt-6 h-7 w-28" />
            <div className="skeleton mt-4 h-2 w-20" />
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div className="panel p-6" key={index}>
            <div className="skeleton h-4 w-40" />
            <div className="skeleton mt-8 h-60 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ filters, product }: { filters: Filters; product: string }) {
  return (
    <section className="panel state-panel">
      <div>
        <SearchX className="mx-auto mb-4 size-10 text-muted-foreground" />
        <h3 className="font-semibold">
          Sem cotações para {product} entre {fullDate(filters.inicio)} e {fullDate(filters.fim)}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">Experimente outro produto, período ou seleção de praças.</p>
      </div>
    </section>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section className="panel state-panel" role="alert">
      <div>
        <AlertCircle className="mx-auto mb-4 size-10 text-negative" />
        <h3 className="font-semibold">Não foi possível carregar as cotações</h3>
        <p className="mb-5 mt-2 text-sm text-muted-foreground">{message}</p>
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          <RotateCcw className="size-4" />
          Tentar novamente
        </button>
      </div>
    </section>
  );
}
