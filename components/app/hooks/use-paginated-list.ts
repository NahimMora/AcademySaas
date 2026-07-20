"use client";

import { useEffect, useRef, useState } from "react";

interface PageResult<T> { items: T[]; hasMore: boolean }

// Lista con paginación server-side: cualquier cambio en `params` (filtros, academia, búsqueda ya
// debounceada por quien llama) dispara un refetch desde la página 1; `loadMore` pide la siguiente.
// `fetchPage` debe venir memoizado (useCallback) para que el efecto no reconsulte en cada render.
export function usePaginatedList<T, P>({ params, pageSize = 25, fetchPage }: {
  params: P | null;
  pageSize?: number;
  fetchPage(params: P, page: number, pageSize: number): Promise<PageResult<T>>;
}) {
  const [items, setItems] = useState<T[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const pageRef = useRef(1);
  const key = params === null ? null : JSON.stringify(params);

  useEffect(() => {
    if (params === null) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      pageRef.current = 1;
      void fetchPage(params, 1, pageSize)
        .then((result) => { if (!cancelled) { setItems(result.items); setHasMore(result.hasMore); } })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` ya representa el contenido de `params`
  }, [key, pageSize, fetchPage, reloadNonce]);

  async function loadMore() {
    if (params === null || loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = pageRef.current + 1;
      const result = await fetchPage(params, nextPage, pageSize);
      setItems((current) => [...(current ?? []), ...result.items]);
      setHasMore(result.hasMore);
      pageRef.current = nextPage;
    } finally {
      setLoading(false);
    }
  }

  function reload() { setReloadNonce((n) => n + 1); }

  return { items, hasMore, loading, loadMore, reload };
}
