const zone = "America/Argentina/Buenos_Aires";
function parts(value: string | Date) {
  const map = Object.fromEntries(new Intl.DateTimeFormat("es-AR", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short" }).formatToParts(new Date(value)).map(part => [part.type, part.value]));
  return map;
}
export function formatDate(value: string | Date) { const p=parts(value);return `${p.day}/${p.month}/${p.year}`; }
export function formatTime(value: string | Date) { const p=parts(value);return `${p.hour}:${p.minute}`; }
export function formatDateTime(value: string | Date) { return `${formatDate(value)} · ${formatTime(value)}`; }
export function formatShortDate(value: string | Date) { const p=parts(value);return `${p.weekday} ${p.day}/${p.month}`; }
export function pluralize(count: number, singular: string, plural = `${singular}s`) { return `${count} ${count === 1 ? singular : plural}`; }
