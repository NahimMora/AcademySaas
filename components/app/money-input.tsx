"use client";

// value/onChange llevan un string numérico plano ("1500.5", sin separadores) — mismo contrato que
// los <input type="number"> que reemplaza, así el resto de cada formulario (Number(amount)*100, etc.)
// no cambia. Lo que cambia es la presentación: separador de miles "." y decimales con ",", prefijo "$".
// El texto mostrado se deriva de value en cada render (sin estado propio ni efecto): parseInput ya
// preserva la coma/punto final mientras se escribe (ej. "1500." al tipear la coma decimal), así que
// formatDisplay(value) alcanza para no perder ese estado intermedio.
function formatDisplay(raw: string): string {
  if (!raw) return "";
  const [intPart = "0", decPart] = raw.split(".");
  const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decPart !== undefined ? `${withDots},${decPart}` : withDots;
}

function parseInput(display: string): string {
  const cleaned = display.replace(/[^0-9,]/g, "");
  const [intPart = "", ...rest] = cleaned.split(",");
  const intClean = intPart.replace(/^0+(?=\d)/, "") || "0";
  if (rest.length === 0) return intClean;
  const decPart = rest.join("").slice(0, 2);
  return `${intClean}.${decPart}`;
}

export function MoneyInput({
  value, onChange, required, autoFocus, id
}: { value: string; onChange(next: string): void; required?: boolean; autoFocus?: boolean; id?: string }) {
  return <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 muted select-none">$</span>
    <input
      id={id} className="field pl-7" inputMode="decimal" autoFocus={autoFocus} required={required}
      value={formatDisplay(value)}
      onChange={(e) => onChange(parseInput(e.target.value))}
    />
  </div>;
}
