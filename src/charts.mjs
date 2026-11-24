// Small static SVG charts: a sparkline and a horizontal bar chart.
// Colours come from CSS (currentColor), so the charts follow the theme.

import { attrs, escapeHtml, mergeAttrs } from "./html.mjs";
import { formatCompact, formatNumber } from "./format.mjs";

const round = (n) => Math.round(n * 100) / 100;

function positiveNumber(option, value) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${option} must be a positive number; got ${JSON.stringify(value)}`);
  }
  return value;
}

/**
 * A word-only summary of a series, used as the sparkline's accessible name.
 */
export function describeSeries(values) {
  const nums = values.filter(Number.isFinite);
  if (nums.length === 0) return "no data";
  const first = nums[0];
  const last = nums[nums.length - 1];
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return `${nums.length} points, from ${formatNumber(first)} to ${formatNumber(last)}, low ${formatNumber(min)}, high ${formatNumber(max)}`;
}

/**
 * A compact trend line. Non-numeric entries (null, NaN) leave a gap.
 * The latest point is marked. The SVG is role="img" with a label that
 * states the range in words.
 */
export function sparkline({
  values = [],
  width = 120,
  height = 32,
  label = "Trend",
  area = true,
  className,
  attrs: extra,
} = {}) {
  if (!Array.isArray(values)) throw new TypeError("sparkline: values must be an array");
  positiveNumber("sparkline width", width);
  positiveNumber("sparkline height", height);
  const nums = values.map((v) => (v === null || v === undefined || v === "" ? NaN : Number(v)));
  const finite = nums.filter(Number.isFinite);
  const a = mergeAttrs(
    {
      class: "lx-sparkline",
      viewBox: `0 0 ${width} ${height}`,
      width: String(width),
      height: String(height),
      role: "img",
      "aria-label": `${label}: ${describeSeries(nums)}`,
      focusable: "false",
    },
    extra,
    className,
  );
  if (finite.length === 0) {
    return `<svg${attrs(a)}><line class="lx-sparkline__empty" x1="0" y1="${round(height / 2)}" x2="${width}" y2="${round(height / 2)}" stroke="currentColor" stroke-dasharray="2 3"/></svg>`;
  }
  const pad = 3;
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const span = max - min;
  const step = nums.length > 1 ? (width - pad * 2) / (nums.length - 1) : 0;
  const x = (i) => round(nums.length > 1 ? pad + i * step : width / 2);
  const y = (v) => round(span === 0 ? height / 2 : pad + (1 - (v - min) / span) * (height - pad * 2));

  const segments = [];
  let current = [];
  nums.forEach((v, i) => {
    if (Number.isFinite(v)) current.push([x(i), y(v)]);
    else if (current.length) {
      segments.push(current);
      current = [];
    }
  });
  if (current.length) segments.push(current);

  const line = segments.map((seg) => seg.map(([px, py], i) => `${i ? "L" : "M"}${px} ${py}`).join(" ")).join(" ");
  const fill =
    area && segments.length
      ? segments
          .filter((seg) => seg.length > 1)
          .map((seg) => `M${seg[0][0]} ${height} ${seg.map(([px, py]) => `L${px} ${py}`).join(" ")} L${seg[seg.length - 1][0]} ${height} Z`)
          .join(" ")
      : "";
  let lastIndex = nums.length - 1;
  while (!Number.isFinite(nums[lastIndex])) lastIndex -= 1;

  return (
    `<svg${attrs(a)}>` +
    (fill ? `<path class="lx-sparkline__area" d="${fill}" fill="currentColor" stroke="none"/>` : "") +
    `<path class="lx-sparkline__line" d="${line}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle class="lx-sparkline__point" cx="${x(lastIndex)}" cy="${y(nums[lastIndex])}" r="2.5" fill="currentColor"/>` +
    `</svg>`
  );
}

function barPath(x0, x1, top, h, radius) {
  const w = Math.abs(x1 - x0);
  if (w === 0) return "";
  const r = Math.min(radius, w, h / 2);
  const dir = x1 > x0 ? 1 : -1;
  const sweep = dir > 0 ? 1 : 0;
  const edge = x1 - dir * r;
  return (
    `M${round(x0)} ${round(top)} H${round(edge)} ` +
    `A${round(r)} ${round(r)} 0 0 ${sweep} ${round(x1)} ${round(top + r)} ` +
    `V${round(top + h - r)} ` +
    `A${round(r)} ${round(r)} 0 0 ${sweep} ${round(edge)} ${round(top + h)} ` +
    `H${round(x0)} Z`
  );
}

function truncate(text, max) {
  const s = String(text ?? "");
  return s.length > max ? `${s.slice(0, Math.max(1, max - 1))}…` : s;
}

/**
 * A horizontal bar chart for comparing a handful of named values.
 * Bars grow from a zero baseline (negative values grow left), with the
 * data end rounded and the value printed beside it. The SVG is
 * decorative for assistive technology; the same numbers are given as a
 * table (visually hidden unless `showTable` is true).
 */
export function barChart({
  data = [],
  title,
  width = 480,
  barHeight = 20,
  gap = 10,
  labelWidth = 120,
  formatValue = formatCompact,
  showTable = false,
  emptyMessage = "No data to show.",
  className,
  attrs: extra,
} = {}) {
  if (!Array.isArray(data)) throw new TypeError("barChart: data must be an array");
  if (!title) throw new TypeError("barChart: title is required");
  positiveNumber("barChart width", width);
  positiveNumber("barChart barHeight", barHeight);
  const rows = data.map((d) => ({ label: d?.label ?? "", value: Number(d?.value) }));
  const fig = mergeAttrs({ class: "lx-chart" }, extra, className);
  const caption = `<figcaption class="lx-chart__title">${escapeHtml(title)}</figcaption>`;
  if (rows.length === 0) {
    return `<figure${attrs(fig)}>${caption}<p class="lx-chart__empty">${escapeHtml(emptyMessage)}</p></figure>`;
  }
  for (const row of rows) {
    if (!Number.isFinite(row.value)) {
      throw new TypeError(`barChart: value for ${JSON.stringify(row.label)} is not a number`);
    }
  }

  const bar = Math.min(barHeight, 24);
  const valueWidth = 64;
  const min = Math.min(0, ...rows.map((r) => r.value));
  const max = Math.max(0, ...rows.map((r) => r.value));
  // Negative bars print their value on the left, so they need room there too.
  const plotLeft = labelWidth + 8 + (min < 0 ? valueWidth : 0);
  const plotWidth = Math.max(40, width - plotLeft - (max > 0 ? valueWidth : 8));
  const span = max - min || 1;
  const sx = (v) => plotLeft + ((v - min) / span) * plotWidth;
  const zero = sx(0);
  const height = rows.length * (bar + gap) + gap;
  const maxChars = Math.max(4, Math.floor(labelWidth / 7));

  const bars = rows
    .map((row, i) => {
      const top = gap + i * (bar + gap);
      const mid = round(top + bar / 2);
      const end = sx(row.value);
      const valueText = formatValue(row.value);
      const negative = row.value < 0;
      const valueX = negative ? end - 6 : end + 6;
      return (
        `<g class="lx-chart__row">` +
        `<title>${escapeHtml(`${row.label}: ${valueText}`)}</title>` +
        `<rect class="lx-chart__hit" x="0" y="${round(top - gap / 2)}" width="${width}" height="${round(bar + gap)}" fill="transparent"/>` +
        `<text class="lx-chart__label" x="${labelWidth}" y="${mid}" text-anchor="end" dominant-baseline="central">${escapeHtml(truncate(row.label, maxChars))}</text>` +
        (row.value === 0 ? "" : `<path class="lx-chart__bar${negative ? " lx-chart__bar--negative" : ""}" d="${barPath(zero, end, top, bar, 4)}" fill="currentColor"/>`) +
        `<text class="lx-chart__value" x="${round(valueX)}" y="${mid}" text-anchor="${negative ? "end" : "start"}" dominant-baseline="central">${escapeHtml(valueText)}</text>` +
        `</g>`
      );
    })
    .join("");

  const axis = `<line class="lx-chart__axis" x1="${round(zero)}" y1="0" x2="${round(zero)}" y2="${round(height)}" stroke="currentColor"/>`;
  const svg =
    `<svg class="lx-chart__svg" viewBox="0 0 ${width} ${round(height)}" width="${width}" height="${round(height)}" aria-hidden="true" focusable="false">` +
    bars +
    axis +
    `</svg>`;
  const table =
    `<table class="${showTable ? "lx-chart__table" : "lx-sr-only"}">` +
    `<thead><tr><th scope="col">Item</th><th scope="col" class="lx-num">Value</th></tr></thead><tbody>` +
    rows
      .map((row) => `<tr><th scope="row">${escapeHtml(row.label)}</th><td class="lx-num">${escapeHtml(formatValue(row.value))}</td></tr>`)
      .join("") +
    `</tbody></table>`;
  return `<figure${attrs(fig)}>${caption}${svg}${table}</figure>`;
}
