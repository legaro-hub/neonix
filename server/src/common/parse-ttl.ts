export function parseTtlSeconds(ttl: string, defaultSeconds = 900): number {
  const m = /^(\d+)([smhd])$/.exec(ttl.trim());
  if (!m) return defaultSeconds;
  const n = Number(m[1]);
  switch (m[2]) {
    case 's': return n;
    case 'm': return n * 60;
    case 'h': return n * 3600;
    case 'd': return n * 86400;
    default: return defaultSeconds;
  }
}
