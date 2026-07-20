export function requestId(request: Request) {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}

export function timingSafeEqualText(left: string, right: string) {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index++) diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return diff === 0;
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const requestOrigin = new URL(request.url).origin;
  const expected = process.env.NEXT_PUBLIC_APP_URL || requestOrigin;
  if (process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(new URL(origin).hostname)) return true;
  return origin === requestOrigin || origin === new URL(expected).origin;
}
