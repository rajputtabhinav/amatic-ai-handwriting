/**
 * End-to-End Encryption for Collaboration
 * Uses Web Crypto API with AES-GCM for secure data transfer
 * 
 * The encryption key is stored in the URL hash (never sent to server)
 */

// ============================================
// Constants
// ============================================

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for AES-GCM

// ============================================
// Key Generation & Management
// ============================================

/**
 * Generate a new random encryption key
 * Returns a base64-encoded string suitable for URL hash
 */
export async function generateEncryptionKey(): Promise<string> {
  const key = new Uint8Array(16); // 128 bits
  crypto.getRandomValues(key);
  return bytesToBase64Url(key);
}

/**
 * Generate a random room ID
 */
export function generateRoomId(length: number = 20): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => chars[byte % chars.length]).join('');
}

/**
 * Import a base64-encoded key string into a CryptoKey
 */
async function importKey(keyString: string): Promise<CryptoKey> {
  const keyBytes = base64UrlToBytes(keyString);
  
  return crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// ============================================
// Encryption & Decryption
// ============================================

/**
 * Encrypt data with the given key
 * Returns { encryptedBuffer, iv } for transmission
 */
export async function encryptData(
  keyString: string,
  data: Uint8Array
): Promise<{ encryptedBuffer: ArrayBuffer; iv: Uint8Array }> {
  const key = await importKey(keyString);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
    key,
    data.buffer as ArrayBuffer
  );
  
  return { encryptedBuffer, iv };
}

/**
 * Decrypt data with the given key
 */
export async function decryptData(
  keyString: string,
  encryptedBuffer: ArrayBuffer,
  iv: Uint8Array
): Promise<Uint8Array> {
  const key = await importKey(keyString);
  
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
    key,
    encryptedBuffer
  );
  
  return new Uint8Array(decryptedBuffer);
}

/**
 * Encrypt a JSON object
 */
export async function encryptJSON<T>(
  keyString: string,
  data: T
): Promise<{ encryptedBuffer: ArrayBuffer; iv: Uint8Array }> {
  const json = JSON.stringify(data);
  const encoded = new TextEncoder().encode(json);
  return encryptData(keyString, encoded);
}

/**
 * Decrypt to a JSON object
 */
export async function decryptJSON<T>(
  keyString: string,
  encryptedBuffer: ArrayBuffer,
  iv: Uint8Array
): Promise<T> {
  const decrypted = await decryptData(keyString, encryptedBuffer, iv);
  const json = new TextDecoder().decode(decrypted);
  return JSON.parse(json) as T;
}

// ============================================
// Base64 URL-safe Encoding
// ============================================

/**
 * Convert bytes to base64 URL-safe string
 */
function bytesToBase64Url(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Convert base64 URL-safe string to bytes
 */
function base64UrlToBytes(base64Url: string): Uint8Array {
  // Restore standard base64 characters
  let base64 = base64Url
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  // Add padding if needed
  while (base64.length % 4) {
    base64 += '=';
  }
  
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// ============================================
// URL Hash Key Management
// ============================================

/**
 * Extract encryption key from URL hash
 * URL format: https://example.com/dashboard?room=xxx#encryptionKey
 */
export function getKeyFromUrlHash(): string | null {
  if (typeof window === 'undefined') return null;
  
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return null;
  
  // Remove the leading #
  const key = hash.slice(1);
  
  // Validate key length
  if (key.length < 16) return null;
  
  return key;
}

/**
 * Set encryption key in URL hash without triggering navigation
 */
export function setKeyInUrlHash(key: string): void {
  if (typeof window === 'undefined') return;
  
  const newUrl = new URL(window.location.href);
  newUrl.hash = key;
  
  // Use replaceState to avoid adding to history
  window.history.replaceState(null, '', newUrl.toString());
}

/**
 * Get room ID from URL query params
 */
export function getRoomIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  const params = new URLSearchParams(window.location.search);
  return params.get('room');
}

/**
 * Generate a full collaboration link
 */
export function generateCollabLink(roomId: string, roomKey: string): string {
  if (typeof window === 'undefined') {
    return `https://amatic.ai/dashboard?room=${roomId}#${roomKey}`;
  }
  
  const baseUrl = `${window.location.origin}/dashboard`;
  return `${baseUrl}?room=${roomId}#${roomKey}`;
}

/**
 * Parse a collaboration link
 */
export function parseCollabLink(link: string): { roomId: string; roomKey: string } | null {
  try {
    const url = new URL(link);
    const roomId = url.searchParams.get('room');
    const roomKey = url.hash.slice(1); // Remove leading #
    
    if (!roomId || !roomKey) return null;
    
    return { roomId, roomKey };
  } catch {
    return null;
  }
}

// ============================================
// Validation
// ============================================

/**
 * Validate encryption key format
 */
export function isValidEncryptionKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  
  // Should be at least 16 characters (128 bits base64)
  if (key.length < 16) return false;
  
  // Should only contain base64 URL-safe characters
  const validChars = /^[A-Za-z0-9_-]+$/;
  return validChars.test(key);
}

/**
 * Validate room ID format
 */
export function isValidRoomId(roomId: string): boolean {
  if (!roomId || typeof roomId !== 'string') return false;
  
  // Should be alphanumeric, 10-30 characters
  const validFormat = /^[A-Za-z0-9]{10,30}$/;
  return validFormat.test(roomId);
}

