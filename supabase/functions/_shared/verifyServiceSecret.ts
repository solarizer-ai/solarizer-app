export function verifyServiceSecret(req: Request): boolean {
  const secret = req.headers.get('x-service-secret');
  const expected = Deno.env.get('SESSION_SECRET');

  if (!secret || !expected) return false;

  const enc = new TextEncoder();
  const a = enc.encode(secret);
  const b = enc.encode(expected);

  if (a.byteLength !== b.byteLength) {
    // Dummy comparison to maintain constant time
    crypto.subtle.timingSafeEqual(a, a);
    return false;
  }

  return crypto.subtle.timingSafeEqual(a, b);
}
