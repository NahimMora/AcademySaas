"use client";

import { useEffect, useState } from "react";
import type { StudentHit } from "@/lib/cash/types";

export function StudentPicker({ academyId, selected, onSelect }: { academyId: string; selected: StudentHit | null; onSelect(hit: StudentHit | null): void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentHit[]>([]);

  useEffect(() => {
    if (selected || query.trim().length === 0) return;
    const timer = window.setTimeout(async () => {
      const response = await fetch(`/api/students/search?q=${encodeURIComponent(query)}&academyId=${academyId}`);
      if (response.ok) setResults((await response.json()).students);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, selected, academyId]);

  if (selected) {
    return <div className="field flex items-center justify-between">
      <span><strong>{selected.lastName}, {selected.firstName}</strong> <span className="muted">· {selected.publicCode}</span></span>
      <button type="button" onClick={() => { onSelect(null); setQuery(""); setResults([]); }} className="text-xs font-bold text-[var(--brand)]">Cambiar</button>
    </div>;
  }
  return <div className="relative">
    <input className="field" placeholder="Buscar por nombre, código o DNI…" value={query} onChange={(e) => { const value = e.target.value; setQuery(value); if (!value.trim()) setResults([]); }} autoComplete="off" />
    {results.length > 0 && <div className="absolute z-10 mt-1 w-full card p-1 max-h-56 overflow-y-auto">
      {results.map((hit) => <button type="button" key={hit.id} onClick={() => { onSelect(hit); setResults([]); }} className="block w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-[var(--brand-soft)]">{hit.lastName}, {hit.firstName} <span className="muted text-xs">· {hit.publicCode}</span></button>)}
    </div>}
  </div>;
}
