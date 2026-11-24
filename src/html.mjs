// Low-level helpers shared by every component: escaping, attribute
// serialisation, URL filtering, ids and option validation.

const ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#96;",
};

/**
 * Escape a value for use in HTML text or a quoted attribute value.
 * `null` and `undefined` become an empty string; everything else is
 * converted with `String()`.
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"'`]/g, (ch) => ESCAPES[ch]);
}

const ATTR_NAME = /^[a-zA-Z_:][a-zA-Z0-9_:.-]*$/;
const URL_ATTRS = new Set(["href", "src", "action", "formaction", "xlink:href", "poster", "cite"]);
const SAFE_URL = /^(?:https?:|mailto:|tel:|[^a-z]|[a-z0-9+.-]+(?:[^a-z0-9+.:-]|$))/i;

/**
 * Return `url` when it is relative or uses http(s), mailto or tel.
 * Anything else (javascript:, data:, vbscript:, ...) becomes "#".
 */
export function safeUrl(url) {
  if (url === null || url === undefined) return "#";
  // Strip characters browsers ignore inside a scheme, so "java\tscript:" is caught.
  const value = String(url).trim();
  const probe = value.replace(/[\u0000-\u001F\u007F\s]+/g, "");
  if (probe === "") return "#";
  return SAFE_URL.test(probe) ? value : "#";
}

/**
 * Serialise an attribute object to a string with a leading space per
 * attribute. `true` renders a bare boolean attribute; `false`, `null`
 * and `undefined` are skipped. Names are validated and inline event
 * handlers (`on*`) are refused, because the kit never emits script.
 */
export function attrs(map = {}) {
  let out = "";
  for (const [name, value] of Object.entries(map)) {
    if (value === false || value === null || value === undefined) continue;
    if (name === "class" && value === "") continue;
    if (!ATTR_NAME.test(name)) {
      throw new TypeError(`Invalid attribute name: ${JSON.stringify(name)}`);
    }
    if (/^on/i.test(name)) {
      throw new TypeError(`Event handler attributes are not allowed: ${name}`);
    }
    if (value === true) {
      out += ` ${name}`;
      continue;
    }
    const text = URL_ATTRS.has(name.toLowerCase()) ? safeUrl(value) : value;
    out += ` ${name}="${escapeHtml(text)}"`;
  }
  return out;
}

/** Join class names, skipping falsy entries. */
export function cx(...names) {
  return names.flat().filter(Boolean).join(" ");
}

/**
 * Merge caller-supplied attributes over component defaults. `class` is
 * appended rather than replaced so component styling is never lost.
 */
export function mergeAttrs(defaults, extra = {}, className) {
  const merged = { ...defaults };
  for (const [key, value] of Object.entries(extra ?? {})) {
    if (key === "class") continue;
    merged[key] = value;
  }
  merged.class = cx(defaults.class, className, extra?.class) || undefined;
  return merged;
}

let counter = 0;

/** Deterministic, incrementing ids for aria wiring. */
export function uid(prefix = "lx") {
  counter += 1;
  return `${prefix}-${counter}`;
}

/** Reset the id counter (useful per request on a server, and in tests). */
export function resetIds() {
  counter = 0;
}

/** Throw a RangeError unless `value` is one of `allowed`. */
export function oneOf(option, value, allowed) {
  if (!allowed.includes(value)) {
    throw new RangeError(
      `${option} must be one of ${allowed.map((v) => JSON.stringify(v)).join(", ")}; got ${JSON.stringify(value)}`,
    );
  }
  return value;
}

/** Visually hidden text for screen readers. */
export function srOnly(text) {
  return `<span class="lx-sr-only">${escapeHtml(text)}</span>`;
}
