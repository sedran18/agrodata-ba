"use client";

import { Info } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { money, placeName, shortDate, shortPlace } from "@/lib/format";
import type { PrecoPorData, PrecoPorPraca } from "@/lib/types";
import type { ReactNode } from "react";

function ChartPanel({
  title,
  subtitle,
  children,
  legend,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  legend?: ReactNode;
}) {
  return (
    <section className="panel min-w-0" aria-label={title}>
      <div className="chart-header">
        <div>
          <h3 className="chart-title">{title}</h3>
          <p className="chart-subtitle">{subtitle}</p>
        </div>
        <Info className="size-3.5 shrink-0 text-muted-foreground" aria-label={subtitle} />
      </div>
      <div className="chart-area" role="img" aria-label={title}>
        {children}
      </div>
      {legend && <div className="chart-legend">{legend}</div>}
    </section>
  );
}

function PriceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const title = typeof label === "string" && /^\d{4}-/.test(label) ? shortDate(label) : label;
  return (
    <div className="chart-tooltip">
      <p className="mb-2 font-medium">{title}</p>
      {payload.map((item) => (
        <p key={item.name}>
          {item.name}: {typeof item.value === "number" ? money(item.value) : item.value}
        </p>
      ))}
    </div>
  );
}

const grid = { stroke: "var(--border)", strokeDasharray: "3 4", vertical: false };

export function PriceLineChart({ data }: { data: PrecoPorData[] }) {
  return (
    <ChartPanel
      title="Evolução do preço"
      subtitle="Média diária das cotações selecionadas"
      legend={
        <span>
          <i className="legend-line" />
          Preço médio
        </span>
      }
    >
      {data.length === 0 ? (
        <p className="chart-empty">Sem cotações diárias neste período.</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid {...grid} />
            <XAxis dataKey="data" tickFormatter={shortDate} minTickGap={35} axisLine={false} tickLine={false} dy={8} />
            <YAxis
              domain={["dataMin - 2", "dataMax + 2"]}
              tickFormatter={(value) => Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip content={<PriceTooltip />} />
            <Line
              type="monotone"
              dataKey="preco_medio"
              name="Preço médio"
              stroke="var(--chart-green)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
}

export function PracaBarChart({ data }: { data: PrecoPorPraca[] }) {
  const rows = [...data]
    .sort((a, b) => b.preco_medio - a.preco_medio)
    .map((item) => ({ ...item, nome: placeName(item.praca_nome) }));

  return (
    <ChartPanel
      title="Preço médio por praça"
      subtitle="Comparativo entre praças"
      legend={
        <span>
          <i className="legend-line" />
          Preço médio no período
        </span>
      }
    >
      {rows.length === 0 ? (
        <p className="chart-empty">Sem praças com cotação neste período.</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 4 }}>
            <CartesianGrid {...grid} horizontal={false} vertical />
            <XAxis
              type="number"
              tickFormatter={(value) => Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
              domain={[0, "dataMax + 5"]}
              axisLine={false}
              tickLine={false}
            />
            <YAxis type="category" dataKey="nome" width={137} axisLine={false} tickLine={false} tickFormatter={shortPlace} />
            <Tooltip content={<PriceTooltip />} />
            <Bar dataKey="preco_medio" name="Preço médio" fill="var(--chart-bar)" radius={[0, 3, 3, 0]} barSize={13} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
}
