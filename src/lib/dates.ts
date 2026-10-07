const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-20" → "20 Oct 2026". Parsed by hand so the timezone can never shift the day. */
export function formatDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** "2026-10-20" → "20 Oct" for compact tables. */
export function formatShortDate(ymd: string): string {
  const [, m, d] = ymd.split("-").map(Number);
  if (!m || !d) return ymd;
  return `${d} ${MONTHS[m - 1]}`;
}

export const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
