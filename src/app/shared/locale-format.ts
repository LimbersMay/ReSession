/**
 * Formats a relative time distance (e.g. "dentro de 2 h", "hace 3 h" / "in 2 hr.", "3 hr. ago").
 * Rounded according to duration brackets.
 */
export function formatRelativeTime(target: number, lang: string, now = Date.now()): string {
  const diffMs = target - now;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHours = Math.round(diffMin / 60);
  const diffDays = Math.round(diffHours / 24);

  const formatter = new Intl.RelativeTimeFormat(lang, { style: 'short', numeric: 'always' });

  const absSec = Math.abs(diffSec);
  if (absSec < 60) {
    return formatter.format(diffSec, 'second');
  }

  const absMin = Math.abs(diffMin);
  if (absMin < 60) {
    return formatter.format(diffMin, 'minute');
  }

  const absHours = Math.abs(diffHours);
  if (absHours < 48) {
    return formatter.format(diffHours, 'hour');
  }

  return formatter.format(diffDays, 'day');
}

/**
 * Formats byte amounts into readable metric steps (e.g. "812 B", "14,2 KB", "1,3 MB").
 * Number decimal separator uses the active locale; unit symbols (B, KB, MB) remain fixed.
 */
export function formatBytes(bytes: number, lang: string): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    const num = new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(kb);
    return `${num} KB`;
  }

  const mb = kb / 1024;
  const num = new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(mb);
  return `${num} MB`;
}
