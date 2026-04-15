/**
 * Simple in-memory rate limiter. Suitable for single-instance deployments.
 * Each window is keyed by `${prefix}:${ip}`.
 */

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

// Prune expired entries every 5 minutes to avoid unbounded growth
setInterval(() => {
  const now = Date.now();
  for (const [key, win] of store) {
    if (win.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * @param prefix  Logical bucket name (e.g. "landlord-form")
 * @param ip      Client IP address
 * @param limit   Max requests allowed per window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(
  prefix: string,
  ip: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const key = `${prefix}:${ip}`;
  const now = Date.now();
  let win = store.get(key);

  if (!win || win.resetAt < now) {
    win = { count: 0, resetAt: now + windowMs };
    store.set(key, win);
  }

  win.count++;

  return {
    allowed: win.count <= limit,
    remaining: Math.max(0, limit - win.count),
    resetAt: win.resetAt,
  };
}

/** Extract best-guess client IP from Next.js headers. */
export function getClientIp(headersList: Headers): string {
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown"
  );
}
