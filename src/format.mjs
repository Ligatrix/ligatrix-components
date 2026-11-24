// Number formatting used by metric tiles, tables and charts.

const compactFormat = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const plainFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/** Format a number as 1,284 / 12.9K / 4.2M. Non-finite input returns "—". */
export function formatCompact(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return Math.abs(n) < 10_000 ? plainFormat.format(n) : compactFormat.format(n);
}

/** Format a number with grouping and at most two decimals. */
export function formatNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? plainFormat.format(n) : "—";
}

/** True for finite numbers and numeric strings such as "12.5". */
export function isNumeric(value) {
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string" && value.trim() !== "") return Number.isFinite(Number(value));
  return false;
}
