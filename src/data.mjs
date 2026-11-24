// Metric tiles, data tables and status timelines.

import { attrs, cx, escapeHtml, mergeAttrs, oneOf, safeUrl, srOnly } from "./html.mjs";
import { formatCompact, isNumeric } from "./format.mjs";
import { sparkline } from "./charts.mjs";

/**
 * A headline number with a label, an optional signed delta and an
 * optional trend line. The delta's colour is direction × whether up is
 * good, and the direction is also spelled out for screen readers.
 */
export function metricTile({
  label,
  value,
  delta,
  deltaSuffix = "%",
  period,
  upIsGood = true,
  trend,
  format = formatCompact,
  className,
  attrs: extra,
} = {}) {
  if (label === undefined || label === null || label === "") {
    throw new TypeError("metricTile: label is required");
  }
  const shown = typeof value === "number" ? format(value) : value ?? "—";
  let deltaHtml = "";
  if (delta !== undefined && delta !== null) {
    if (!isNumeric(delta)) throw new TypeError(`metricTile: delta must be a number; got ${JSON.stringify(delta)}`);
    const d = Number(delta);
    const direction = d > 0 ? "up" : d < 0 ? "down" : "flat";
    const tone =
      direction === "flat" ? "neutral" : (direction === "up") === Boolean(upIsGood) ? "good" : "bad";
    const arrow = { up: "▲", down: "▼", flat: "▬" }[direction];
    const words = { up: "Up", down: "Down", flat: "No change" }[direction];
    const magnitude = `${formatCompact(Math.abs(d))}${deltaSuffix}`;
    const sign = direction === "up" ? "+" : direction === "down" ? "−" : "";
    deltaHtml =
      `<p class="lx-metric__delta lx-metric__delta--${tone}" data-direction="${direction}">` +
      `<span aria-hidden="true">${arrow} ${escapeHtml(sign + magnitude)}</span>` +
      srOnly(direction === "flat" ? words : `${words} ${magnitude}`) +
      (period ? ` <span class="lx-metric__period">${escapeHtml(period)}</span>` : "") +
      `</p>`;
  }
  const trendHtml =
    Array.isArray(trend) && trend.length
      ? `<div class="lx-metric__trend">${sparkline({ values: trend, label: `${label} trend`, width: 96, height: 28 })}</div>`
      : "";
  const a = mergeAttrs({ class: "lx-metric" }, extra, className);
  return (
    `<div${attrs(a)}>` +
    `<p class="lx-metric__label">${escapeHtml(label)}</p>` +
    `<p class="lx-metric__value">${escapeHtml(shown)}</p>` +
    deltaHtml +
    trendHtml +
    `</div>`
  );
}

const SORT_DIRECTIONS = ["ascending", "descending"];

function cellText(column, row) {
  const raw = row?.[column.key];
  if (typeof column.format === "function") return column.format(raw, row);
  if (raw === null || raw === undefined || raw === "") return null;
  return raw;
}

/**
 * A data table. Columns describe the data; rows are plain objects.
 *
 * - `numeric: true` right-aligns a column and uses tabular figures.
 * - `sortable: true` renders the header as a button (or a link when
 *   `sortHref(key, direction)` is given); the current `sort` sets aria-sort.
 * - `format(value, row)` returns text (escaped); `render(value, row)`
 *   returns markup you trust (for badges and links).
 * - No rows renders a single full-width empty row.
 */
export function dataTable({
  columns,
  rows = [],
  caption,
  captionHidden = false,
  sort,
  sortHref,
  emptyMessage = "No records to show.",
  rowKey,
  density = "comfortable",
  className,
  attrs: extra,
} = {}) {
  if (!Array.isArray(columns) || columns.length === 0) {
    throw new TypeError("dataTable: columns must be a non-empty array");
  }
  const keys = new Set();
  for (const column of columns) {
    if (!column || typeof column.key !== "string" || column.key === "") {
      throw new TypeError("dataTable: every column needs a string key");
    }
    if (keys.has(column.key)) throw new TypeError(`dataTable: duplicate column key "${column.key}"`);
    keys.add(column.key);
  }
  if (sort) oneOf("dataTable sort.direction", sort.direction, SORT_DIRECTIONS);
  oneOf("dataTable density", density, ["comfortable", "compact"]);

  const head = columns
    .map((column) => {
      const label = column.label ?? column.key;
      const active = sort && sort.key === column.key;
      const ariaSort = column.sortable ? (active ? sort.direction : "none") : undefined;
      const thAttrs = attrs({
        scope: "col",
        class: cx(column.numeric && "lx-num", column.sortable && "lx-table__sortable"),
        "aria-sort": ariaSort,
        style: column.width ? `width:${String(column.width).replace(/[^0-9a-z.%]/gi, "")}` : undefined,
      });
      if (!column.sortable) return `<th${thAttrs}>${escapeHtml(label)}</th>`;
      const next = active && sort.direction === "ascending" ? "descending" : "ascending";
      const indicator = `<span class="lx-table__sort-icon" data-state="${active ? sort.direction : "none"}" aria-hidden="true"></span>`;
      const control =
        typeof sortHref === "function"
          ? `<a class="lx-table__sort" href="${escapeHtml(safeUrl(sortHref(column.key, next)))}">${escapeHtml(label)}${indicator}</a>`
          : `<button type="button" class="lx-table__sort" data-sort-key="${escapeHtml(column.key)}" data-sort-next="${next}">${escapeHtml(label)}${indicator}</button>`;
      return `<th${thAttrs}>${control}</th>`;
    })
    .join("");

  let body;
  if (!Array.isArray(rows) || rows.length === 0) {
    body =
      `<tr class="lx-table__empty"><td colspan="${columns.length}">` +
      `<span class="lx-table__empty-text">${escapeHtml(emptyMessage)}</span></td></tr>`;
  } else {
    body = rows
      .map((row, index) => {
        const key = typeof rowKey === "function" ? rowKey(row, index) : rowKey ? row?.[rowKey] : undefined;
        const cells = columns
          .map((column) => {
            let content;
            if (typeof column.render === "function") {
              content = column.render(row?.[column.key], row) ?? "";
            } else {
              const text = cellText(column, row);
              content =
                text === null
                  ? `<span aria-hidden="true">—</span>${srOnly("Empty")}`
                  : escapeHtml(text);
            }
            const tag = column.rowHeader ? "th" : "td";
            const cellAttrs = attrs({ class: column.numeric ? "lx-num" : undefined, scope: tag === "th" ? "row" : undefined });
            return `<${tag}${cellAttrs}>${content}</${tag}>`;
          })
          .join("");
        return `<tr${attrs({ "data-key": key })}>${cells}</tr>`;
      })
      .join("");
  }

  const a = mergeAttrs({ class: cx("lx-table", `lx-table--${density}`) }, extra, className);
  const cap = caption
    ? `<caption${captionHidden ? ' class="lx-sr-only"' : ""}>${escapeHtml(caption)}</caption>`
    : "";
  const wrapAttrs = caption ? { class: "lx-table-wrap", role: "region", "aria-label": caption, tabindex: "0" } : { class: "lx-table-wrap" };
  return (
    `<div${attrs(wrapAttrs)}><table${attrs(a)}>${cap}` +
    `<thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`
  );
}

export const TIMELINE_STATES = ["done", "current", "upcoming", "failed"];
const STATE_WORDS = { done: "Completed", current: "In progress", upcoming: "Not started", failed: "Failed" };

function toDateTime(time) {
  if (time instanceof Date) {
    if (Number.isNaN(time.getTime())) return null;
    return { iso: time.toISOString(), text: `${time.toISOString().slice(0, 16).replace("T", " ")} UTC` };
  }
  return null;
}

/**
 * An ordered list of steps with a state each. The current step carries
 * aria-current="step", and every state is written out, never colour alone.
 */
export function timeline({ items = [], label = "Progress", className, attrs: extra } = {}) {
  if (!Array.isArray(items)) throw new TypeError("timeline: items must be an array");
  const a = mergeAttrs({ class: "lx-timeline", "aria-label": label }, extra, className);
  const lis = items
    .map((item) => {
      const state = item.state ?? "upcoming";
      oneOf("timeline item state", state, TIMELINE_STATES);
      let timeHtml = "";
      if (item.time !== undefined && item.time !== null && item.time !== "") {
        const dt = toDateTime(item.time);
        timeHtml = dt
          ? `<time class="lx-timeline__time" datetime="${dt.iso}">${escapeHtml(item.timeLabel ?? dt.text)}</time>`
          : `<span class="lx-timeline__time">${escapeHtml(item.timeLabel ?? item.time)}</span>`;
      } else if (item.timeLabel) {
        timeHtml = `<span class="lx-timeline__time">${escapeHtml(item.timeLabel)}</span>`;
      }
      return (
        `<li${attrs({ class: cx("lx-timeline__item", `lx-timeline__item--${state}`), "aria-current": state === "current" ? "step" : undefined })}>` +
        `<span class="lx-timeline__marker" aria-hidden="true"></span>` +
        `<div class="lx-timeline__content">` +
        `<p class="lx-timeline__title">${escapeHtml(item.title)} ${srOnly(`(${STATE_WORDS[state]})`)}</p>` +
        timeHtml +
        (item.description ? `<p class="lx-timeline__description">${escapeHtml(item.description)}</p>` : "") +
        `</div></li>`
      );
    })
    .join("");
  return `<ol${attrs(a)}>${lis}</ol>`;
}

