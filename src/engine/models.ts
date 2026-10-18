/**
 * A browser cookie, with the fields of `chrome.cookies.Cookie` that ReSession uses,
 * plus a computed identity.
 */
export interface Cookie {
  /**
   * Identity of the cookie (D8): `domain|path|name`, e.g. `.github.com|/|user_session`.
   * Chrome does not provide it; it is computed when the cookie is read.
   */
  id: string;
  name: string;
  value: string;
  /** With a leading dot (`.github.com`) when subdomains also receive it. */
  domain: string;
  /** `true` when only the exact host receives it (the domain has no leading dot). */
  hostOnly: boolean;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  /** Same values as Chrome. `no_restriction` is `SameSite=None`. */
  sameSite: 'no_restriction' | 'lax' | 'strict' | 'unspecified';
  /** `true` when it has no expiration date and dies with the browser session. */
  session: boolean;
  /** Seconds since the Unix epoch, as Chrome reports it. Only set when `session` is `false`. */
  expirationDate: number | undefined;
  /** Cookie store: `'0'` for normal windows, `'1'` for incognito (D22). */
  storeId: string;
}

/** What a cookie group stands for: the exact host, the shared root domain, or third-party trackers. */
export type CookieGroupKind = 'host' | 'root' | 'trackers';

/**
 * A collapsible folder of cookies in the tree.
 * Written by hand in phase 1; computed by `engine/tree.ts` in phase 2.
 *
 * It holds data only: the head texts ("Current subdomain"…) are translated by the UI from
 * `kind`, so the engine never depends on a language.
 */
export interface CookieGroup {
  /** Stable and unique within its view (`tab:host`). Used to collapse and to track the group. */
  key: string;
  /** Decides the head texts, the head icon and the head action. */
  kind: CookieGroupKind;
  /**
   * Domain the group stands for (`gist.github.com`, `.github.com`), or `null` when the group
   * mixes domains, as the trackers group of a tab does.
   */
  domain: string | null;

  cookies: Cookie[];
  /** Whitelist pattern that protects the whole group, or `null` when none does. */
  whitelistedBy: string | null;
}

/** Storage areas supported by the active tab. */
export type StorageArea = 'local' | 'session';

/** A key-value pair stored in the tab's web storage. */
export interface StorageEntry {
  /** Area and key joined by a pipe (`local|auth_token`). Ensures uniqueness. */
  readonly id: string;
  readonly area: StorageArea;
  readonly key: string;
  /** Storage strictly holds string values. */
  readonly value: string;
}


