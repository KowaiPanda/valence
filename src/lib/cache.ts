import { createHmac } from "crypto";

// ── In-memory cache (for agent scores — same instance only) ──────────────────
type CacheEntry<T> = { value: T; expires: number };
const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs = 60_000) {
  store.set(key, { value, expires: Date.now() + ttlMs });
}

// ── HMAC search pass tokens (works across serverless instances) ───────────────
// Token format: "address:expires:signature"
// Self-contained — no shared state needed between verify-payment and search routes

const SECRET = process.env.TOKEN_SECRET ?? "valence-dev-secret-change-in-prod";
const TTL_MS = 5 * 60 * 1000;

export function issueToken(address: string): string {
  const expires = Date.now() + TTL_MS;
  const payload = `${address.toLowerCase()}:${expires}`;
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}:${sig}`;
}

export function verifyToken(address: string, token: string): boolean {
  try {
    const parts = token.split(":");
    if (parts.length !== 3) return false;
    const [tokenAddr, expiresStr, sig] = parts;

    if (tokenAddr !== address.toLowerCase()) return false;
    if (Date.now() > parseInt(expiresStr)) return false;

    const payload = `${tokenAddr}:${expiresStr}`;
    const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
    return sig === expected;
  } catch {
    return false;
  }
}