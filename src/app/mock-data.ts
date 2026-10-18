import { Cookie, CookieGroup } from '../engine/models';

/*
 * Phase 1 test data: the same cookies the mockup paints.
 * Only views import this file (guide rule 6). Step 14 replaces it with the SessionStore.
 */

/** The fields a test cookie must set; the rest take the defaults of `cookie()`. */
type CookieSeed = Pick<Cookie, 'name' | 'value' | 'domain'> & Partial<Cookie>;

/**
 * Builds a test cookie with sensible defaults: path `/`, session, not secure, `lax`, normal store.
 * The `id` and `hostOnly` are derived from the domain, path and name, as Chrome data will be.
 */
const cookie = (c: CookieSeed): Cookie => {
  const path = c.path ?? '/';
  return {
    id: `${c.domain}|${path}|${c.name}`,
    hostOnly: !c.domain.startsWith('.'),
    path,
    secure: false,
    httpOnly: false,
    sameSite: 'lax',
    session: true,
    expirationDate: undefined,
    storeId: '0',
    ...c,
  };
};

const gistSession = cookie({ name: 'gist_session', value: 'ghs_89A7sdFk982jKqP2xL0m', domain: 'gist.github.com', secure: true, httpOnly: true });
const userSession = cookie({ name: 'user_session', value: 'PKC_99xKa81ZlaQ7nV3', domain: '.github.com', secure: true, httpOnly: true });
const dotcomUser = cookie({ name: 'dotcom_user', value: 'limbers', domain: '.github.com', secure: true, httpOnly: true });

export const MOCK_TAB_GROUPS: CookieGroup[] = [
  {
    key: 'tab:host',
    kind: 'host',
    domain: 'gist.github.com',
    whitelistedBy: null,
    cookies: [
      gistSession,
      cookie({ name: 'gist_ui_theme', value: 'dark_high_contrast', domain: 'gist.github.com', secure: true }),
      cookie({ name: 'last_viewed_gist', value: 'c98ef201ba', domain: 'gist.github.com' }),
    ],
  },
  {
    key: 'tab:root',
    kind: 'root',
    domain: '.github.com',
    whitelistedBy: 'github.com',
    cookies: [
      userSession,
      dotcomUser,
      cookie({ name: 'logged_in', value: 'yes', domain: '.github.com', secure: true }),
    ],
  },
  {
    key: 'tab:trackers',
    kind: 'trackers',
    domain: null,
    whitelistedBy: null,
    cookies: [
      cookie({ name: 'IDE', value: 'AHWqTUv_9281xQe', domain: '.doubleclick.net', secure: true, sameSite: 'no_restriction' }),
      cookie({ name: 'MUID', value: '1A2B3C4D5E6F7A8B', domain: '.bing.com', secure: true, sameSite: 'no_restriction' }),
    ],
  },
];

export const MOCK_LOCKED_IDS: ReadonlySet<string> = new Set([gistSession.id, userSession.id, dotcomUser.id]);


import { StorageArea, StorageEntry } from '../engine/models';

export const MOCK_TAB_ORIGIN = 'https://gist.github.com';

/** Helper para construir entradas de storage con su id compuesto (area|key). */
function createMockStorageEntry(area: StorageArea, key: string, value: string): StorageEntry {
  return {
    id: `${area}|${key}`,
    area,
    key,
    value,
  };
}

/** Genera un JWT válido en base64url que expira dentro de 2 horas. */
function generateMockJwt(): string {
  const toBase64Url = (obj: Record<string, unknown>): string => {
    const json = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const header = toBase64Url({ alg: 'HS256', typ: 'JWT' });
  const nowSec = Math.floor(Date.now() / 1000);
  const payload = toBase64Url({
    sub: 'limbers',
    team: 'Diseño',
    role: 'developer',
    exp: nowSec + 2 * 3600, // Expira exactamente dentro de 2 horas
  });
  const signature = 's7zH2L8X3xQ9vKp1mN4rT6wY8aB0cD2eF5gH7jK9lM0';

  return `${header}.${payload}.${signature}`;
}

export const MOCK_STORAGE_ENTRIES: StorageEntry[] = [
  createMockStorageEntry('local', 'auth_token', generateMockJwt()),
  createMockStorageEntry(
    'local',
    'ui_preferences',
    '{"theme":"dark","sidebarCollapsed":false,"codeWrap":true}'
  ),
  createMockStorageEntry(
    'session',
    'draft_gist_temp',
    'const debounce = (fn, delay) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); }; };\n'.repeat(7)
  ),
];
