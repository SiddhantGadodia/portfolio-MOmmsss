export const SESSION_COOKIE_NAME = "session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const SESSION_MAX_AGE_SECONDS = SESSION_DURATION_MS / 1000;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET environment variable is not set");
  return secret;
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = new Uint8Array(bytes);
  let str = "";
  for (const b of arr) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return toBase64Url(sig);
}

export async function createSessionCookieValue(username: string): Promise<string> {
  const expires = Date.now() + SESSION_DURATION_MS;
  const payload = `${username}.${expires}`;
  const sig = await hmac(payload);
  return `${toBase64Url(new TextEncoder().encode(payload))}.${sig}`;
}

export async function verifySessionCookieValue(value: string): Promise<string | null> {
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;

  const payload = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
  const expectedSig = await hmac(payload);
  if (expectedSig !== sig) return null;

  const dotIndex = payload.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const username = payload.slice(0, dotIndex);
  const expires = Number(payload.slice(dotIndex + 1));
  if (!username || !expires || Date.now() > expires) return null;

  return username;
}
