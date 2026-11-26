"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowUpRight,
  CalendarDays,
  CircleCheck,
  Database,
  Leaf,
  MapPin,
  Moon,
  Sun,
  TriangleAlert,
} from "lucide-react";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { PracaBarChart, PriceLineChart } from "@/components/dashboard/charts";
import { EmptyState, ErrorState, KpiGrid, LoadingState, PracaTable, RankingList } from "@/components/dashboard/panels";
import { usePainel } from "@/hooks/use-painel";
import { filtersFromSearch, filtersToQuery, validateFilters } from "@/lib/filters";
import { fullDate, placeName } from "@/lib/format";
import { getIntervalo, getPracas, getProdutos } from "@/services/api";
import type { Filters, Intervalo, Praca, Produto } from "@/lib/types";

type Catalog = {
  produtos: Produto[];
  pracas: Praca[];
  intervalo: Intervalo | null;
};

type CatalogResult = {
  attempt: number;
  catalog: Catalog | null;
  error: string | null;
};

function downloadCsv(filters: Filters, produto: string, rows: { data: string; preco_medio: number }[], pracas: { praca_nome: string; preco_medio: number; min_preco: number; max_preco: number }[]) {
  const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const price = (value: number) => value.toFixed(2).replace(".", ",");
  const lines = [
    "Data;Produto;Preço médio (R$)",
    ...rows.map((row) => [fullDate(row.data), quote(produto), price(row.preco_medio)].join(";")),
    "",
    "Praça;Produto;Preço médio (R$);Mínimo (R$);Máximo (R$)",
    ...pracas.map((row) => [quote(placeName(row.praca_nome)), quote(produto), price(row.preco_medio), price(row.min_preco), price(row.max_preco)].join(";")),
  ];
  const url = URL.createObjectURL(new Blob([`\uFEFF${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `radar-${filters.inicio}-${filters.fim}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function Dashboard() {
  const [catalogResult, setCatalogResult] = useState<CatalogResult | null>(null);
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [draft, setDraft] = useState<Filters | null>(null);
  const [applied, setApplied] = useState<Filters | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [dark, setDark] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const painel = usePainel(applied);
  const catalog = catalogResult?.attempt === catalogAttempt ? catalogResult.catalog : null;
  const catalogError = catalogResult?.attempt === catalogAttempt ? catalogResult.error : null;
  const catalogLoading = !catalogResult || catalogResult.attempt !== catalogAttempt;

  useEffect(() => {
    const controller = new AbortController();
    const attempt = catalogAttempt;

    Promise.all([
      getProdutos(controller.signal),
      getPracas(controller.signal),
      getIntervalo(controller.signal),
    ])
      .then(([produtos, pracas, intervalo]) => {
        if (controller.signal.aborted) return;
        if (!produtos.length) {
          setCatalogResult({ attempt, catalog: null, error: "Nenhum produto cadastrado." });
          return;
        }
        const initial = filtersFromSearch(window.location.search, produtos, pracas, intervalo);
        setCatalogResult({ attempt, catalog: { produtos, pracas, intervalo }, error: null });
        setDraft(initial.filters);
        setApplied(initial.filters);
        setFilterError(null);
        window.history.replaceState(null, "", `?${filtersToQuery(initial.filters)}`);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : "Não foi possível carregar os filtros.";
        setCatalogResult({ attempt, catalog: null, error: message });
      });

    return () => controller.abort();
  }, [catalogAttempt]);

  useEffect(() => {
    const saved = localStorage.getItem("radar-theme") === "dark";
    document.documentElement.classList.toggle("dark", saved);
    const timer = window.setTimeout(() => setDark(saved), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const restore = () => {
      if (!catalog || !draft) return;
      const next = filtersFromSearch(window.location.search, catalog.produtos, catalog.pracas, catalog.intervalo);
      setFilterError(next.error);
      if (!next.error) {
        setDraft(next.filters);
        setApplied(next.filters);
      }
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [catalog, draft]);

  const product = applied?.produtoId ? catalog?.produtos.find((item) => item.id === applied.produtoId) : undefined;
  const productLabel = product ? placeName(product.nome) : "Todos os produtos";
  const loading = catalogLoading || !applied || painel.state.status === "idle" || painel.state.status === "loading";
  const canExport = painel.state.status === "ready" && (painel.state.data.serie.length > 0 || painel.state.data.dadosPraca.length > 0);

  const apply = () => {
    if (!draft || !catalog) return;
    const error = validateFilters(draft, catalog.produtos, catalog.pracas, catalog.intervalo);
    setFilterError(error);
    if (error) return;
    setApplied({ ...draft });
    window.history.pushState(null, "", `?${filtersToQuery(draft)}`);
  };

  const exportCsv = () => {
    if (painel.state.status !== "ready" || !applied) {
      setExportError("Não há dados para exportar.");
      return;
    }
    setExporting(true);
    setExportError(null);
    try {
      downloadCsv(applied, productLabel, painel.state.data.serie, painel.state.data.dadosPraca);
    } catch {
      setExportError("Não foi possível exportar. Tente novamente.");
    } finally {
      setExporting(false);
    }
  };

  const selectPraca = (nome: string) => {
    if (!draft || !catalog) return;
    const praca = catalog.pracas.find((item) => item.nome === nome);
    if (!praca) return;
    setDraft({ ...draft, pracaIds: [praca.id] });
    setFilterError(null);
  };

  return (
    <>
      <header className="topbar">
        <div className="page-wrap flex h-full items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="brand-mark">
              <Leaf className="size-6" />
            </div>
            <div>
              <div className="text-[15px] font-semibold">
                AgroData<span className="ml-1 text-primary">BA</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <span className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
              <MapPin className="size-3.5" />
              Bahia, Brasil
            </span>
            <span className="hidden h-5 border-r sm:block" />
            <button
              type="button"
              className="btn btn-ghost icon-btn"
              aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
              onClick={() => {
                const next = !dark;
                setDark(next);
                localStorage.setItem("radar-theme", next ? "dark" : "light");
              }}
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="page-wrap pb-8 pt-6">
        <div className="mb-4 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="text-foreground">Painel de cotações</span>
        </div>

        <section className="hero">
          <Image
            src="/bahia-fields.jpg"
            alt="Lavouras verdes e campos agrícolas no oeste da Bahia"
            className="hero-photo"
            fill
            priority
            sizes="(max-width: 1440px) 100vw, 1440px"
          />
          <div className="hero-copy">
            <div className="hero-eyebrow mb-2 flex flex-wrap items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-hero-foreground" />
              Mercado agropecuário · Bahia
            </div>
            <h1>AgroData</h1>
            <p className="mb-4 mt-2 text-[12px] opacity-85">
              Acompanhe as cotações e os movimentos do mercado agrícola baiano.
            </p>
            <div className="source-badge">
              <Database className="size-3" />
              Fonte: SEAGRI-BA
              {catalog?.intervalo ? ` · Dados até ${fullDate(catalog.intervalo.end)}` : ""}
            </div>
          </div>
        </section>

        <div className="mb-4 mt-4 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Database className="size-3" />
            Cotações coletadas da SEAGRI-BA
          </span>
          <span className="hidden items-center gap-1.5 sm:flex">
            <CircleCheck className="size-3 text-positive" />
            Preços de referência
          </span>
        </div>

        {catalog && draft && (
          <FilterBar
            filters={draft}
            onChange={(next) => {
              setDraft(next);
              setFilterError(null);
            }}
            onApply={apply}
            onExport={exportCsv}
            products={catalog.produtos}
            pracas={catalog.pracas}
            error={filterError}
            range={catalog.intervalo}
            exporting={exporting}
            canExport={canExport}
          />
        )}
        {exportError && (
          <p role="alert" className="mt-3 text-xs text-negative">
            {exportError}
          </p>
        )}

        <div className="mb-4 mt-7 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-semibold">Visão geral</h2>
            <span className="max-w-full rounded-md bg-accent px-2 py-1 text-[10px] font-medium break-words text-primary">
              {applied ? productLabel : "Produto"}
            </span>
          </div>
          {applied && (
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <CalendarDays className="size-3" />
              {fullDate(applied.inicio)} a {fullDate(applied.fim)}
            </span>
          )}
        </div>

        {catalogError ? (
          <ErrorState message={catalogError} onRetry={() => setCatalogAttempt((current) => current + 1)} />
        ) : loading ? (
          <LoadingState />
        ) : painel.state.status === "error" ? (
          <ErrorState message={painel.state.message} onRetry={painel.reload} />
        ) : painel.state.status === "empty" && applied ? (
          <EmptyState filters={applied} product={productLabel} />
        ) : painel.state.status === "ready" ? (
          <>
            {painel.state.data.estatisticas.total < 3 && (
              <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-amber/30 bg-amber-soft p-3 text-xs text-amber">
                <TriangleAlert className="size-4" />
                Poucas amostras: interprete com cautela
              </div>
            )}
            <KpiGrid data={painel.state.data.estatisticas} />
            <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
              <PriceLineChart data={painel.state.data.serie} />
              <PracaBarChart data={painel.state.data.porPraca} />
            </div>
            <div className="mt-5">
              <PracaTable data={painel.state.data.dadosPraca} />
            </div>
            <div className="mt-5">
              <RankingList ranking={painel.state.data.ranking} onSelect={selectPraca} />
            </div>
          </>
        ) : null}

        <footer className="mt-7 border-t pb-8 pt-5">
          <div className="flex flex-wrap justify-between gap-3">
            <span className="flex items-center gap-1.5 text-[11px] font-medium">
              <Leaf className="size-3.5 text-primary" />
              AgroData
            </span>
            <a
              href="https://www.seagri.ba.gov.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex max-w-full flex-wrap items-center gap-1 text-[10px] text-primary"
            >
              Secretaria da Agricultura da Bahia · SEAGRI-BA
              <ArrowUpRight className="size-3" />
            </a>
          </div>
          <p className="mt-3 text-[10px] leading-5 text-muted-foreground">
            Na fonte oficial, os dados são coletados diariamente e podem apresentar lacunas. Os valores são preços de
            referência e não constituem uma oferta de compra ou venda.
          </p>
        </footer>
      </main>
    </>
  );
}
