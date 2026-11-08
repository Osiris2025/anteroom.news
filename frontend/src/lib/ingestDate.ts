// Human-readable ingest date for article cards, e.g. "Nov 7, 2026".
// Always America/New_York with a fixed locale so server and client render the
// same string (no hydration mismatch). Card CSS uppercases it.
const FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function ingestDate(value?: string | Date | null): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? "" : FMT.format(d);
}
