export function verifyServiceSecret(req: Request): boolean {
  const secret = req.headers.get('x-service-secret');
  const expected = Deno.env.get('SESSION_SECRET');

  if (!secret || !expected) return false;

  const enc = new TextEncoder();
  const a = enc.encode(secret);
  const b = enc.encode(expected);

  if (a.byteLength !== b.byteLength) return false;

  // Constant-time comparison via XOR
  let mismatch = 0;
  for (let i = 0; i < a.byteLength; i++) {
    mismatch |= a[i] ^ b[i];
  }
  return mismatch === 0;
}
