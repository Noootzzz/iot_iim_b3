// Helper functions for admin session tokens
// Uses Web Crypto API (~no extra dependencies, edge-compatible)

const COOKIE_NAME = "admin_session";
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function getSecret(): string {
  const s = process.env.ADMIN_SECRET;
  if (!s) throw new Error("ADMIN_SECRET env var is missing");
  return s;
}

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function b64url(buf: ArrayBuffer): string {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function b64urlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64");
}

export async function signToken(username: string): Promise<string> {
  const payload = JSON.stringify({
    username,
    role: "admin",
    exp: Date.now() + TOKEN_TTL_MS,
  });
  const enc = new TextEncoder();
  const key = await getKey(getSecret());
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return `${b64url(enc.encode(payload))}.${b64url(sig)}`;
}

export async function verifyToken(
  token: string,
): Promise<{ username: string; role: string } | null> {
  try {
    const [payloadB64, sigB64] = token.split(".");
    if (!payloadB64 || !sigB64) return null;

    const payloadBytes = b64urlDecode(payloadB64);
    const sigBytes = b64urlDecode(sigB64);
    const key = await getKey(getSecret());

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      payloadBytes,
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(payloadBytes));
    if (payload.exp < Date.now()) return null;

    return { username: payload.username, role: payload.role };
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
