export function verifyServiceSecret(req: Request): boolean {
  const secret = req.headers.get('x-service-secret');
  const expected = Deno.env.get('SESSION_SECRET');

  if (!secret || !expected) return false;

  const enc = new TextEncoder();
  const a = enc.encode(secret);
  const b = enc.encode(expected);

  // Pad to same length for constant-time comparison
  const len = Math.max(a.byteLength, b.byteLength);
  const aPadded = new Uint8Array(len);
  const bPadded = new Uint8Array(len);
  aPadded.set(a);
  bPadded.set(b);

  const equal = crypto.subtle.timingSafeEqual(aPadded, bPadded);
  // Must also check original lengths match
  return equal && a.byteLength === b.byteLength;
}
