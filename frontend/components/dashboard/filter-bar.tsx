"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CalendarDays, Check, ChevronsUpDown, Download, LoaderCircle, MapPin, SlidersHorizontal, Wheat } from "lucide-react";
import { fullDate, maskPtDate, parsePtDate, placeName } from "@/lib/format";
import type { Filters, Intervalo, Praca, Produto } from "@/lib/types";

function Combo({
  label,
  icon,
  value,
  open,
  onOpenChange,
  children,
  className,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) onOpenChange(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  return (
    <div className={className} ref={ref}>
      <span className="filter-label">{label}</span>
      <div className="combo">
        <button
          type="button"
          className="filter-control"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => onOpenChange(!open)}
        >
          <span className="flex min-w-0 items-center gap-2">
            {icon}
            <span className="truncate">{value}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
        {open && (
          <div id={listId} className="combo-panel">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

function DateField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
}) {
  const [editing, setEditing] = useState<{ value: string; text: string } | null>(null);
  const text = editing?.value === value ? editing.text : fullDate(value);

  const commit = (raw: string) => {
    const iso = parsePtDate(raw);
    setEditing(null);
    if (iso) onChange(iso);
  };

  return (
    <label className="filter-field">
      <span className="filter-label">{label}</span>
      <span className="filter-control">
        <input
          className="date-text"
          type="text"
          inputMode="numeric"
          lang="pt-BR"
          size={10}
          placeholder="dd/mm/aaaa"
          aria-label={label}
          value={text}
          maxLength={10}
          onChange={(event) => {
            const masked = maskPtDate(event.target.value);
            setEditing({ value, text: masked });
            const iso = parsePtDate(masked);
            if (iso) onChange(iso);
          }}
          onBlur={() => commit(text)}
        />
        <input
          className="date-native"
          type="date"
          lang="pt-BR"
          tabIndex={-1}
          aria-hidden="true"
          value={value}
          min={min}
          max={max}
          onChange={(event) => {
            if (event.target.value) onChange(event.target.value);
          }}
        />
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
      </span>
    </label>
  );
}

export function FilterBar({
  filters,
  onChange,
  onApply,
  onExport,
  products,
  pracas,
  error,
  range,
  exporting,
  canExport,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onApply: () => void;
  onExport: () => void;
  products: Produto[];
  pracas: Praca[];
  error: string | null;
  range: Intervalo | null;
  exporting: boolean;
  canExport: boolean;
}) {
  const [productOpen, setProductOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const product = products.find((item) => item.id === filters.produtoId);
  const selectedCities = filters.pracaIds === null
    ? "Todas as praças"
    : filters.pracaIds.length === 1
      ? placeName(pracas.find((item) => item.id === filters.pracaIds?.[0])?.nome ?? "1 praça")
      : `${filters.pracaIds.length} praças selecionadas`;

  const visibleProducts = products.filter((item) =>
    placeName(item.nome).toLocaleLowerCase("pt-BR").includes(productQuery.toLocaleLowerCase("pt-BR")),
  );
  const visibleCities = pracas.filter((item) =>
    placeName(item.nome).toLocaleLowerCase("pt-BR").includes(cityQuery.toLocaleLowerCase("pt-BR")),
  );

  return (
    <section className="filter-bar" aria-label="Filtros de cotações">
      <div className="filter-grid">
        <Combo
          className="filter-product"
          label="Produto"
          icon={<Wheat className="size-4 text-muted-foreground" />}
          value={product ? placeName(product.nome) : "Todos os produtos"}
          open={productOpen}
          onOpenChange={setProductOpen}
        >
          <input
            className="combo-search"
            placeholder="Buscar produto..."
            aria-label="Buscar produto"
            value={productQuery}
            onChange={(event) => setProductQuery(event.target.value)}
          />
          <div className="combo-list" role="listbox" aria-label="Produtos">
            {!productQuery && (
              <button
                type="button"
                className="combo-item"
                role="option"
                aria-selected={filters.produtoId === null}
                onClick={() => {
                  onChange({ ...filters, produtoId: null });
                  setProductOpen(false);
                }}
              >
                <Check className={`size-4 ${filters.produtoId === null ? "opacity-100" : "opacity-0"}`} />
                Todos
              </button>
            )}
            {visibleProducts.length === 0 && <p className="combo-empty">Produto não encontrado.</p>}
            {visibleProducts.map((item) => (
              <button
                type="button"
                key={item.id}
                className="combo-item"
                role="option"
                aria-selected={filters.produtoId === item.id}
                onClick={() => {
                  onChange({ ...filters, produtoId: item.id });
                  setProductOpen(false);
                }}
              >
                <Check className={`size-4 ${filters.produtoId === item.id ? "opacity-100" : "opacity-0"}`} />
                {placeName(item.nome)}
              </button>
            ))}
          </div>
        </Combo>

        <DateField
          label="Data inicial"
          value={filters.inicio}
          min={range?.start}
          max={filters.fim || range?.end}
          onChange={(inicio) => onChange({ ...filters, inicio })}
        />

        <DateField
          label="Data final"
          value={filters.fim}
          min={filters.inicio || range?.start}
          max={range?.end}
          onChange={(fim) => onChange({ ...filters, fim })}
        />

        <Combo
          className="filter-pracas"
          label="Praças"
          icon={<MapPin className="size-4 text-muted-foreground" />}
          value={selectedCities}
          open={cityOpen}
          onOpenChange={setCityOpen}
        >
          <input
            className="combo-search"
            placeholder="Buscar praça..."
            aria-label="Buscar praça"
            value={cityQuery}
            onChange={(event) => setCityQuery(event.target.value)}
          />
          <div className="combo-actions">
            <button type="button" onClick={() => onChange({ ...filters, pracaIds: null })}>
              Todas
            </button>
            <button type="button" onClick={() => onChange({ ...filters, pracaIds: [] })}>
              Limpar
            </button>
          </div>
          <div className="combo-list" role="listbox" aria-label="Praças" aria-multiselectable="true">
            {!cityQuery && (
              <button
                type="button"
                className="combo-item"
                role="option"
                aria-selected={filters.pracaIds === null}
                onClick={() => onChange({ ...filters, pracaIds: null })}
              >
                <Check className={`size-4 ${filters.pracaIds === null ? "text-primary" : "opacity-0"}`} />
                Todas
              </button>
            )}
            {visibleCities.length === 0 && <p className="combo-empty">Praça não encontrada.</p>}
            {visibleCities.map((item) => {
              const selected = filters.pracaIds?.includes(item.id) ?? false;
              return (
                <button
                  type="button"
                  key={item.id}
                  className="combo-item"
                  role="option"
                  aria-selected={selected}
                  onClick={() =>
                    onChange({
                      ...filters,
                      pracaIds: selected
                        ? (filters.pracaIds ?? []).filter((id) => id !== item.id)
                        : [...(filters.pracaIds ?? []), item.id],
                    })
                  }
                >
                  <Check className={`size-4 ${selected ? "text-primary" : "opacity-0"}`} />
                  {placeName(item.nome)}
                </button>
              );
            })}
          </div>
        </Combo>

        <button type="button" className="btn btn-primary" onClick={onApply}>
          <SlidersHorizontal className="size-4" />
          Aplicar
        </button>
        <button type="button" className="btn btn-outline" onClick={onExport} disabled={exporting || !canExport}>
          {exporting ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}
          Exportar CSV
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-xs text-negative">
          {error}
        </p>
      )}
    </section>
  );
}

export function dateSummary(inicio: string, fim: string) {
  return `${fullDate(inicio)} a ${fullDate(fim)}`;
}
