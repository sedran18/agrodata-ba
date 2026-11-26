"use client";

import { useEffect, useState } from "react";
import { getPainel } from "@/services/api";
import type { Filters, Painel } from "@/lib/types";

type PainelState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "ready"; data: Painel };

type StoredResult = {
  key: string;
  reloadKey: number;
  state: Exclude<PainelState, { status: "idle" } | { status: "loading" }>;
};

export function usePainel(filters: Filters | null) {
  const key = filters ? JSON.stringify(filters) : "";
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<StoredResult | null>(null);

  useEffect(() => {
    if (!filters) return;
    const controller = new AbortController();
    const requestKey = key;
    const requestReload = reloadKey;

    getPainel(filters, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setResult({
          key: requestKey,
          reloadKey: requestReload,
          state: data ? { status: "ready", data } : { status: "empty" },
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : "Não foi possível carregar as cotações.";
        setResult({
          key: requestKey,
          reloadKey: requestReload,
          state: { status: "error", message },
        });
      });

    return () => controller.abort();
  }, [filters, key, reloadKey]);

  const state: PainelState = !filters
    ? { status: "idle" }
    : result && result.key === key && result.reloadKey === reloadKey
      ? result.state
      : { status: "loading" };

  return { state, reload: () => setReloadKey((current) => current + 1) };
}
