/**
 * Encryption utilities for sensitive data using Web Crypto API
 * Used for GitHub access tokens and other secrets
 */

// Convert string to ArrayBuffer
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  const uint8Array = encoder.encode(str);
  return uint8Array.buffer.slice(uint8Array.byteOffset, uint8Array.byteOffset + uint8Array.byteLength);
}

// Convert ArrayBuffer to string
function arrayBufferToString(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}

// Convert Uint8Array to base64
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Derive a key from the encryption password
async function deriveKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const passwordBuffer = stringToArrayBuffer(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a plaintext string
 * Returns base64-encoded string containing: salt (16 bytes) + iv (12 bytes) + ciphertext
 */
export async function encrypt(plaintext: string, encryptionKey: string): Promise<string> {
  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Get ArrayBuffer from Uint8Array for crypto operations
  const saltBuffer = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength);
  const ivBuffer = iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength);
  
  // Derive key from password
  const key = await deriveKey(encryptionKey, saltBuffer);
  
  // Encrypt
  const plaintextBuffer = stringToArrayBuffer(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    plaintextBuffer
  );
  
  // Combine salt + iv + ciphertext
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
  
  return uint8ArrayToBase64(combined);
}

/**
 * Decrypt a base64-encoded encrypted string
 */
export async function decrypt(encryptedBase64: string, encryptionKey: string): Promise<string> {
  // Decode base64
  const combined = base64ToUint8Array(encryptedBase64);
  
  // Extract salt, iv, and ciphertext
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);
  
  // Get ArrayBuffer from Uint8Array for crypto operations
  const saltBuffer = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength);
  const ivBuffer = iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength);
  const ciphertextBuffer = ciphertext.buffer.slice(ciphertext.byteOffset, ciphertext.byteOffset + ciphertext.byteLength);
  
  // Derive key from password
  const key = await deriveKey(encryptionKey, saltBuffer);
  
  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    ciphertextBuffer
  );
  
  return arrayBufferToString(decrypted);
}

/**
 * Check if a token appears to be encrypted (base64 with expected length)
 */
export function isEncrypted(token: string): boolean {
  if (!token || token.length < 50) return false;
  
  try {
    // Try to decode as base64
    const decoded = atob(token);
    // Encrypted tokens have salt (16) + iv (12) + at least some ciphertext
    return decoded.length >= 28;
  } catch {
    return false;
  }
}
