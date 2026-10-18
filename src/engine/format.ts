import { StorageEntry } from './models';
export type ValueFormat = 'JWT' | 'JSON';

export class ParsedJwt {
  public readonly header: Record<string, unknown> | null
  public readonly payload: Record<string, unknown> | null

  private constructor(
    public readonly raw: string,
    header: Record<string, unknown> | null,
    payload: Record<string, unknown> | null
  ) {
    this.header = header;
    this.payload = payload;
  }

  /**
   * Decodes and returns the payload (second segment) of a JWT string.
   * Returns null if the value is not a valid JWT or fails parsing.
   */
  public static parse(rawValue: string): ParsedJwt | null {
    const trimmed = rawValue.trim();
    const parts = trimmed.split('.');

    // A JWT always has 3 segments (Header, Payload, Signature)
    if (parts.length !== 3) {
      return null;
    }

    try {
      const header = JSON.parse(decodeBase64Url(parts[0]));
      const payload = JSON.parse(decodeBase64Url(parts[1]));

      // It must be an object with the algorithm declared in the header
      if (!header || typeof header !== 'object' || typeof header.alg !== 'string') {
        return null;
      }
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return null;
      }

      return new ParsedJwt(trimmed, header, payload);
    } catch {
      return null;
    }
  }

  /**
   * Expiration date in milliseconds (Epoch timestamp).
   * Can be null if the token does not include the standard "exp" claim.
   */
  public get expiresAt(): number | null {
    const exp = this.payload?.['exp'];
    return typeof exp === 'number' ? exp * 1000 : null;
  }

  public get hasExpiry(): boolean {
    return this.expiresAt !== null;
  }

  public get isExpired(): boolean {
    const at = this.expiresAt;
    return at !== null && at < Date.now();
  }

  /**
   * Indented payload as JSON string to display it directly in the UI.
   */
  public get formattedPayload(): string {
    return JSON.stringify(this.payload, null, 2);
  }

  /**
   * Payload in a single line for compact views.
   */
  public get inlinePayload(): string {
    return JSON.stringify(this.payload);
  }
}

/**
 * Decodes a base64url string into a UTF-8 text string.
 * Handles padding and multi-byte UTF-8 character decoding natively.
 */
function decodeBase64Url(input: string): string {
  // Convert Base64Url to standard Base64
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');

  // Pad with '=' to a multiple of 4
  const padLength = (4 - (base64.length % 4)) % 4;
  base64 = base64.padEnd(base64.length + padLength, '=');

  // atob decodes binary string; Uint8Array + TextDecoder preserves UTF-8 multi-byte characters
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Inspects a value string and detects whether it is a JWT or a JSON payload.
 * Evaluates JWT first (3 base64url segments with an 'alg' header).
 */
export function detectFormat(value: string): ValueFormat | null {
  const trimmed = value.trim();

  // 1. Check for JWT structure (exactly 3 segments separated by dot)
  const parts = trimmed.split('.');
  if (parts.length === 3) {
    try {
      const header = JSON.parse(decodeBase64Url(parts[0]));
      if (header && typeof header === 'object' && typeof header.alg === 'string') {
        return 'JWT';
      }
    } catch {
      // Not a valid JWT header, continue to JSON check
    }
  }

  // 2. Check for JSON structure (starts and ends with {} or [])
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      JSON.parse(trimmed);
      return 'JSON';
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Decodes and returns the payload (second segment) of a JWT string.
 * Returns null if the value is not a valid JWT or fails parsing.
 */
export function decodeJwtPayload(value: string): Record<string, unknown> | null {
  const parts = value.trim().split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    return payload && typeof payload === 'object' && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/**
 * Calculates an approximation of UTF-16 storage bytes for an entry (key + value length * 2).
 */
export function entryBytes(entry: StorageEntry): number {
  return (entry.key.length + entry.value.length) * 2;
}
