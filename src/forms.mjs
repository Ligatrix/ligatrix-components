// Form fields and selects with labels, hints, errors and required markers.

import { attrs, cx, escapeHtml, mergeAttrs, oneOf, srOnly, uid } from "./html.mjs";

export const INPUT_TYPES = [
  "text", "email", "number", "password", "search", "tel", "url", "date", "datetime-local", "time", "month", "textarea",
];

function fieldShell({ id, label, hint, error, required, controlHtml, className }) {
  if (label === undefined || label === null || label === "") {
    throw new TypeError("form field: label is required");
  }
  return (
    `<div class="${escapeHtml(cx("lx-field", error && "lx-field--invalid", className))}">` +
    `<label class="lx-field__label" for="${escapeHtml(id)}">${escapeHtml(label)}` +
    (required ? `<span class="lx-field__required" aria-hidden="true">*</span>${srOnly(" (required)")}` : "") +
    `</label>` +
    (hint ? `<p class="lx-field__hint" id="${escapeHtml(id)}-hint">${escapeHtml(hint)}</p>` : "") +
    controlHtml +
    (error
      ? `<p class="lx-field__error" id="${escapeHtml(id)}-error"><span aria-hidden="true">! </span>${escapeHtml(error)}</p>`
      : "") +
    `</div>`
  );
}

function describedBy(id, hint, error) {
  return [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
}

/**
 * A labelled input or textarea. The hint and error are linked with
 * aria-describedby; an error also sets aria-invalid.
 */
export function formField({
  label,
  name,
  id,
  type = "text",
  value,
  placeholder,
  hint,
  error,
  required = false,
  disabled = false,
  readOnly = false,
  autocomplete,
  rows = 3,
  className,
  inputAttrs,
} = {}) {
  oneOf("formField type", type, INPUT_TYPES);
  const fieldId = id ?? uid("lx-field");
  const base = {
    class: "lx-input",
    id: fieldId,
    name: name ?? undefined,
    placeholder,
    required,
    disabled,
    readonly: readOnly,
    autocomplete,
    "aria-invalid": error ? "true" : undefined,
    "aria-describedby": describedBy(fieldId, hint, error),
  };
  let control;
  if (type === "textarea") {
    const a = mergeAttrs({ ...base, rows: String(rows) }, inputAttrs);
    control = `<textarea${attrs(a)}>${escapeHtml(value)}</textarea>`;
  } else {
    const a = mergeAttrs({ ...base, type, value: value ?? undefined }, inputAttrs);
    control = `<input${attrs(a)}>`;
  }
  return fieldShell({ id: fieldId, label, hint, error, required, controlHtml: control, className });
}

function normaliseOption(option) {
  if (option !== null && typeof option === "object") {
    return { value: String(option.value ?? ""), label: option.label ?? option.value ?? "", disabled: Boolean(option.disabled) };
  }
  return { value: String(option ?? ""), label: option ?? "", disabled: false };
}

/**
 * A labelled native select. Options are strings or { value, label, disabled };
 * groups are { label, options }. `value` is a string, or an array with `multiple`.
 */
export function select({
  label,
  name,
  id,
  options = [],
  value,
  placeholder,
  hint,
  error,
  required = false,
  disabled = false,
  multiple = false,
  className,
  selectAttrs,
} = {}) {
  if (!Array.isArray(options)) throw new TypeError("select: options must be an array");
  const fieldId = id ?? uid("lx-select");
  const selected = new Set(
    (Array.isArray(value) ? value : value === undefined || value === null ? [] : [value]).map(String),
  );
  const renderOption = (raw) => {
    const o = normaliseOption(raw);
    return `<option${attrs({ value: o.value, selected: selected.has(o.value), disabled: o.disabled })}>${escapeHtml(o.label)}</option>`;
  };
  const items = options
    .map((entry) =>
      entry && typeof entry === "object" && Array.isArray(entry.options)
        ? `<optgroup${attrs({ label: entry.label })}>${entry.options.map(renderOption).join("")}</optgroup>`
        : renderOption(entry),
    )
    .join("");
  const placeholderHtml =
    placeholder && !multiple
      ? `<option value=""${selected.size === 0 ? " selected" : ""}${required ? " disabled" : ""}>${escapeHtml(placeholder)}</option>`
      : "";
  const a = mergeAttrs(
    {
      class: "lx-select",
      id: fieldId,
      name: name ?? undefined,
      required,
      disabled,
      multiple,
      "aria-invalid": error ? "true" : undefined,
      "aria-describedby": describedBy(fieldId, hint, error),
    },
    selectAttrs,
  );
  const control = `<select${attrs(a)}>${placeholderHtml}${items}</select>`;
  return fieldShell({ id: fieldId, label, hint, error, required, controlHtml: control, className });
}
