// Parses a comma-separated environment variable into a list, ignoring blanks around and between items:
// " key1, key2,," -> ["key1", "key2"]; undefined or "" -> [].
export function parseList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

// Parses TRUST_PROXY as the number of reverse proxies in front of the API ("1" -> 1), used by Express to
// read the client IP from X-Forwarded-For. Unset or "" -> 0, so the header is ignored. "true" is rejected:
// trusting any number of proxies lets a client spoof its IP and get a fresh rate limit on every request.
export function parseTrustProxy(value: string | undefined): number {
  if (!value) return 0;
  if (!/^\d+$/.test(value)) {
    throw new Error(`Invalid TRUST_PROXY "${value}": use the number of proxies in front of the API (e.g. 1)`);
  }
  return Number(value);
}

// Parses a positive integer environment variable ("100" -> 100), falling back when unset or invalid.
export function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  apiKeys: parseList(process.env.API_KEYS),
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  rateLimit: {
    windowMs: parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    limit: parsePositiveInt(process.env.RATE_LIMIT_MAX, 100),
  },
  database: process.env.DATABASE || 'memory',
  firebase: {
    emulatorHost: process.env.FIRESTORE_EMULATOR_HOST,
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // .env files usually hold the PEM key on one line with literal "\n"; turn them back into line breaks.
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
};
