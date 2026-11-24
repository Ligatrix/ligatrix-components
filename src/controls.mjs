// Buttons, badges, alerts, cards, empty states and pagination.

import { attrs, cx, escapeHtml, mergeAttrs, oneOf, safeUrl, srOnly, uid } from "./html.mjs";

export const BUTTON_VARIANTS = ["primary", "secondary", "ghost", "danger"];
export const BUTTON_SIZES = ["sm", "md", "lg"];
export const STATUSES = ["neutral", "info", "success", "warning", "danger"];
export const ALERT_TONES = ["info", "success", "warning", "danger"];

/**
 * A button, or a link styled as one when `href` is given.
 * A disabled link loses its href and is marked aria-disabled, so it is
 * not focusable and not followed.
 */
export function button({
  label,
  variant = "primary",
  size = "md",
  type = "button",
  href,
  disabled = false,
  loading = false,
  ariaLabel,
  iconHtml = "",
  className,
  attrs: extra,
} = {}) {
  if (label === undefined || label === null || label === "") {
    throw new TypeError("button: label is required");
  }
  oneOf("button variant", variant, BUTTON_VARIANTS);
  oneOf("button size", size, BUTTON_SIZES);
  const cls = cx("lx-button", `lx-button--${variant}`, `lx-button--${size}`, loading && "is-loading");
  const inner =
    (loading ? `<span class="lx-spinner" aria-hidden="true"></span>` : "") +
    (iconHtml ? `<span class="lx-button__icon" aria-hidden="true">${iconHtml}</span>` : "") +
    `<span class="lx-button__label">${escapeHtml(label)}</span>`;

  if (href !== undefined) {
    const inactive = disabled || loading;
    const a = mergeAttrs(
      {
        class: cls,
        href: inactive ? undefined : safeUrl(href),
        "aria-disabled": inactive ? "true" : undefined,
        "aria-busy": loading ? "true" : undefined,
        role: inactive ? "link" : undefined,
        "aria-label": ariaLabel,
      },
      extra,
      className,
    );
    return `<a${attrs(a)}>${inner}</a>`;
  }

  oneOf("button type", type, ["button", "submit", "reset"]);
  const b = mergeAttrs(
    {
      class: cls,
      type,
      disabled: disabled || loading,
      "aria-busy": loading ? "true" : undefined,
      "aria-label": ariaLabel,
    },
    extra,
    className,
  );
  return `<button${attrs(b)}>${inner}</button>`;
}

/** A small status label. The text always carries the meaning; colour only reinforces it. */
export function badge({ label, status = "neutral", dot = true, className, attrs: extra } = {}) {
  oneOf("badge status", status, STATUSES);
  const a = mergeAttrs({ class: cx("lx-badge", `lx-badge--${status}`) }, extra, className);
  const marker = dot ? `<span class="lx-badge__dot" aria-hidden="true"></span>` : "";
  return `<span${attrs(a)}>${marker}${escapeHtml(label)}</span>`;
}

const ALERT_ICONS = { info: "i", success: "✓", warning: "!", danger: "×" };

/**
 * An inline message. Warning and danger use role="alert" (announced at
 * once); info and success use role="status" (announced politely).
 */
export function alert({
  tone = "info",
  title,
  message,
  messageHtml,
  dismissible = false,
  className,
  attrs: extra,
} = {}) {
  oneOf("alert tone", tone, ALERT_TONES);
  const urgent = tone === "warning" || tone === "danger";
  const a = mergeAttrs(
    { class: cx("lx-alert", `lx-alert--${tone}`), role: urgent ? "alert" : "status" },
    extra,
    className,
  );
  const body = messageHtml ?? (message !== undefined ? escapeHtml(message) : "");
  return (
    `<div${attrs(a)}>` +
    `<span class="lx-alert__icon" aria-hidden="true">${ALERT_ICONS[tone]}</span>` +
    `<div class="lx-alert__content">` +
    (title ? `<p class="lx-alert__title">${escapeHtml(title)}</p>` : "") +
    (body ? `<div class="lx-alert__message">${body}</div>` : "") +
    `</div>` +
    (dismissible
      ? `<button type="button" class="lx-alert__dismiss" aria-label="Dismiss"><span aria-hidden="true">×</span></button>`
      : "") +
    `</div>`
  );
}

/**
 * A titled surface. `body` is escaped text; `bodyHtml`, `actionsHtml`
 * and `footerHtml` take markup you trust, such as other components.
 */
export function card({
  title,
  subtitle,
  headingLevel = 2,
  body,
  bodyHtml,
  actionsHtml = "",
  footerHtml = "",
  id,
  className,
  attrs: extra,
} = {}) {
  if (!Number.isInteger(headingLevel) || headingLevel < 1 || headingLevel > 6) {
    throw new RangeError(`card headingLevel must be an integer from 1 to 6; got ${headingLevel}`);
  }
  const cardId = id ?? uid("lx-card");
  const headingId = `${cardId}-title`;
  const h = `h${headingLevel}`;
  const a = mergeAttrs(
    { class: "lx-card", id: cardId, "aria-labelledby": title ? headingId : undefined },
    extra,
    className,
  );
  const header = title
    ? `<header class="lx-card__header"><div>` +
      `<${h} class="lx-card__title" id="${escapeHtml(headingId)}">${escapeHtml(title)}</${h}>` +
      (subtitle ? `<p class="lx-card__subtitle">${escapeHtml(subtitle)}</p>` : "") +
      `</div>` +
      (actionsHtml ? `<div class="lx-card__actions">${actionsHtml}</div>` : "") +
      `</header>`
    : "";
  const content = bodyHtml ?? (body !== undefined ? `<p>${escapeHtml(body)}</p>` : "");
  return (
    `<section${attrs(a)}>` +
    header +
    (content ? `<div class="lx-card__body">${content}</div>` : "") +
    (footerHtml ? `<footer class="lx-card__footer">${footerHtml}</footer>` : "") +
    `</section>`
  );
}

/** A placeholder for a view with nothing to show yet, with an optional next step. */
export function emptyState({
  title = "Nothing here yet",
  message,
  actionHtml = "",
  headingLevel = 3,
  className,
  attrs: extra,
} = {}) {
  if (!Number.isInteger(headingLevel) || headingLevel < 1 || headingLevel > 6) {
    throw new RangeError(`emptyState headingLevel must be an integer from 1 to 6; got ${headingLevel}`);
  }
  const h = `h${headingLevel}`;
  const a = mergeAttrs({ class: "lx-empty" }, extra, className);
  return (
    `<div${attrs(a)}>` +
    `<svg class="lx-empty__icon" viewBox="0 0 24 24" width="32" height="32" aria-hidden="true" focusable="false">` +
    `<path d="M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>` +
    `</svg>` +
    `<${h} class="lx-empty__title">${escapeHtml(title)}</${h}>` +
    (message ? `<p class="lx-empty__message">${escapeHtml(message)}</p>` : "") +
    (actionHtml ? `<div class="lx-empty__action">${actionHtml}</div>` : "") +
    `</div>`
  );
}

/**
 * The page numbers to show, with `null` for a gap. Always includes the
 * first and last page and `siblings` pages either side of the current one.
 *
 *   pageRange(6, 12) -> [1, null, 5, 6, 7, null, 12]
 */
export function pageRange(page, pageCount, siblings = 1) {
  const count = Math.max(0, Math.floor(pageCount));
  if (count === 0) return [];
  const current = Math.min(Math.max(1, Math.floor(page) || 1), count);
  const pages = new Set([1, count]);
  for (let p = current - siblings; p <= current + siblings; p += 1) {
    if (p >= 1 && p <= count) pages.add(p);
  }
  const sorted = [...pages].sort((x, y) => x - y);
  const out = [];
  for (const p of sorted) {
    const prev = out.length ? out[out.length - 1] : null;
    if (prev !== null && p - prev === 2) out.push(prev + 1);
    else if (prev !== null && p - prev > 2) out.push(null);
    out.push(p);
  }
  return out;
}

function pageHref(href, p) {
  if (typeof href === "function") return safeUrl(href(p));
  return safeUrl(String(href).replaceAll("{page}", String(p)));
}

/**
 * Page links inside a labelled nav. `href` is a template containing
 * "{page}" or a function of the page number. Returns "" for one page or none.
 */
export function pagination({
  page = 1,
  pageCount,
  href = "?page={page}",
  siblings = 1,
  label = "Pagination",
  className,
  attrs: extra,
} = {}) {
  const pages = pageRange(page, pageCount, siblings);
  if (pages.length <= 1) return "";
  const count = pages[pages.length - 1];
  const current = Math.min(Math.max(1, Math.floor(page) || 1), count);
  const edge = (target, text, rel, enabled) =>
    enabled
      ? `<li><a class="lx-pagination__link lx-pagination__step" href="${escapeHtml(pageHref(href, target))}" rel="${rel}">${text}</a></li>`
      : `<li><span class="lx-pagination__link lx-pagination__step" aria-disabled="true">${text}</span></li>`;
  const items = pages.map((p) =>
    p === null
      ? `<li><span class="lx-pagination__gap" aria-hidden="true">…</span></li>`
      : p === current
        ? `<li><a class="lx-pagination__link" aria-current="page" href="${escapeHtml(pageHref(href, p))}">${srOnly("Page ")}${p}</a></li>`
        : `<li><a class="lx-pagination__link" href="${escapeHtml(pageHref(href, p))}">${srOnly("Page ")}${p}</a></li>`,
  );
  const a = mergeAttrs({ class: "lx-pagination", "aria-label": label }, extra, className);
  return (
    `<nav${attrs(a)}><ul class="lx-pagination__list">` +
    edge(current - 1, `<span aria-hidden="true">‹</span> Previous`, "prev", current > 1) +
    items.join("") +
    edge(current + 1, `Next <span aria-hidden="true">›</span>`, "next", current < count) +
    `</ul></nav>`
  );
}
