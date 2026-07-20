type Level = "debug" | "info" | "warn" | "error";

const rank: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const configured = (process.env.LOG_LEVEL as Level | undefined) ?? "info";
const sensitiveKeys = /password|token|secret|authorization|dni|qr/i;

function redact(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(redact);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sensitiveKeys.test(key) ? "[REDACTED]" : redact(item)]));
}

export function log(level: Level, message: string, metadata: Record<string, unknown> = {}) {
  if (rank[level] < rank[configured]) return;
  const safeMetadata = redact(metadata) as Record<string, unknown>;
  const entry = JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...safeMetadata });
  if (level === "error") console.error(entry); else if (level === "warn") console.warn(entry); else console.log(entry);
}
