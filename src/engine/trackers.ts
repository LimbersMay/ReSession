/**
 * Known trackers, keyed by registrable domain.
 * Phase 2 replaces it with the bundled list (D14) without changing `trackerName`.
 */
const TRACKERS: Readonly<Record<string, string>> = {
  'doubleclick.net': 'Google Ads',
  'bing.com': 'Microsoft Ads',
};

/**
 * Returns the name of the tracker that owns a cookie domain.
 *
 * The leading dot is ignored, and parent domains are also checked, so
 * `.ad.doubleclick.net` matches `doubleclick.net`.
 *
 * @param domain - Cookie domain, with or without a leading dot.
 * @returns The tracker name, or `null` when the domain is not a known tracker.
 */
export const trackerName = (domain: string): string | null => {
  let host = domain.replace(/^\./, '').toLowerCase();

  while (host.includes('.')) {
    const name = TRACKERS[host];
    if (name) return name;
    host = host.slice(host.indexOf('.') + 1);
  }
  return null;
};
