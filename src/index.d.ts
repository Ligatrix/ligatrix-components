// Type declarations for @ligatrix/components.
//
// Conventions: every component takes one options object and returns an
// HTML string. Options named `...Html` are inserted as-is (pass markup
// you trust, such as another component); every other text option is
// escaped. `attrs` adds attributes to the root element; `className`
// adds classes to it.

/** Extra attributes for a root element. `true` renders a bare attribute; false/null/undefined are skipped. */
export type Attrs = Record<string, string | number | boolean | null | undefined>;

interface Common {
  /** Extra classes for the root element. */
  className?: string;
  /** Extra attributes for the root element. Event handler attributes (`on*`) throw. */
  attrs?: Attrs;
}

// ---------- Helpers ----------

/** Escape text for HTML content or a quoted attribute value. null and undefined become "". */
export function escapeHtml(value: unknown): string;
/** Serialise attributes, each with a leading space. Throws on invalid names and `on*` handlers. */
export function attrs(map?: Attrs): string;
/** Return the URL if it is relative or http(s)/mailto/tel; otherwise "#". */
export function safeUrl(url: unknown): string;
/** Join truthy class names. */
export function cx(...names: Array<string | false | null | undefined | Array<string | false | null | undefined>>): string;
/** Next id from a shared counter, e.g. "lx-card-3". */
export function uid(prefix?: string): string;
/** Reset the id counter, for example once per server response. */
export function resetIds(): void;
/** 1,284 / 12.9K / 4.2M. Non-finite input gives "—". */
export function formatCompact(value: number): string;
/** Grouped number with at most two decimals. Non-finite input gives "—". */
export function formatNumber(value: number): string;

// ---------- Controls ----------

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
export type Status = "neutral" | "info" | "success" | "warning" | "danger";
export type AlertTone = "info" | "success" | "warning" | "danger";

export const BUTTON_VARIANTS: readonly ButtonVariant[];
export const BUTTON_SIZES: readonly ButtonSize[];
export const STATUSES: readonly Status[];
export const ALERT_TONES: readonly AlertTone[];

export interface ButtonOptions extends Common {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ignored when `href` is set. */
  type?: "button" | "submit" | "reset";
  /** Render a link styled as a button. Unsafe URLs become "#". */
  href?: string;
  disabled?: boolean;
  /** Shows a spinner, disables the control and sets aria-busy. */
  loading?: boolean;
  ariaLabel?: string;
  /** Trusted markup for a leading icon; hidden from assistive technology. */
  iconHtml?: string;
}
export function button(options: ButtonOptions): string;

export interface BadgeOptions extends Common {
  label: string;
  status?: Status;
  /** Show the coloured dot. Default true. */
  dot?: boolean;
}
export function badge(options: BadgeOptions): string;

export interface AlertOptions extends Common {
  tone?: AlertTone;
  title?: string;
  message?: string;
  /** Trusted markup used instead of `message`. */
  messageHtml?: string;
  /** Adds a close button labelled "Dismiss". Wiring it up is left to the page. */
  dismissible?: boolean;
}
export function alert(options: AlertOptions): string;

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface CardOptions extends Common {
  title?: string;
  subtitle?: string;
  headingLevel?: HeadingLevel;
  /** Escaped text, wrapped in a paragraph. */
  body?: string;
  bodyHtml?: string;
  actionsHtml?: string;
  footerHtml?: string;
  /** Root id; the heading id is `${id}-title`. Assigned automatically when omitted. */
  id?: string;
}
export function card(options: CardOptions): string;

export interface EmptyStateOptions extends Common {
  title?: string;
  message?: string;
  actionHtml?: string;
  headingLevel?: HeadingLevel;
}
export function emptyState(options?: EmptyStateOptions): string;

/** Page numbers to show, with null for a gap. */
export function pageRange(page: number, pageCount: number, siblings?: number): Array<number | null>;

export interface PaginationOptions extends Common {
  page?: number;
  pageCount: number;
  /** A template containing "{page}", or a function of the page number. Default "?page={page}". */
  href?: string | ((page: number) => string);
  siblings?: number;
  /** The nav's accessible name. Default "Pagination". */
  label?: string;
}
/** Returns "" when there is one page or none. */
export function pagination(options: PaginationOptions): string;

// ---------- Forms ----------

export type InputType =
  | "text" | "email" | "number" | "password" | "search" | "tel" | "url"
  | "date" | "datetime-local" | "time" | "month" | "textarea";
export const INPUT_TYPES: readonly InputType[];

export interface FormFieldOptions {
  label: string;
  name?: string;
  /** Control id; hint and error ids derive from it. Assigned automatically when omitted. */
  id?: string;
  type?: InputType;
  value?: string | number;
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  autocomplete?: string;
  /** Rows for a textarea. Default 3. */
  rows?: number;
  /** Extra classes for the field wrapper. */
  className?: string;
  /** Extra attributes for the input or textarea. */
  inputAttrs?: Attrs;
}
export function formField(options: FormFieldOptions): string;

export type SelectOption = string | number | { value: string | number; label?: string; disabled?: boolean };
export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

export interface SelectOptions {
  label: string;
  name?: string;
  id?: string;
  options: Array<SelectOption | SelectGroup>;
  /** The selected value, or values with `multiple`. */
  value?: string | number | Array<string | number>;
  /** A first, empty option. Disabled when the field is required. Ignored with `multiple`. */
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  multiple?: boolean;
  className?: string;
  /** Extra attributes for the select element. */
  selectAttrs?: Attrs;
}
export function select(options: SelectOptions): string;

// ---------- Data ----------

export interface MetricTileOptions extends Common {
  label: string;
  /** Numbers are passed through `format`; strings are shown as given. */
  value: number | string;
  /** Signed change, e.g. 6.4 or -3.1. */
  delta?: number;
  /** Appended to the delta. Default "%". */
  deltaSuffix?: string;
  /** What the delta compares with, e.g. "vs last week". */
  period?: string;
  /** Whether an increase is good news. Default true. */
  upIsGood?: boolean;
  /** Values for a small trend line. */
  trend?: Array<number | null>;
  /** Formats a numeric value. Default formatCompact. */
  format?: (value: number) => string;
}
export function metricTile(options: MetricTileOptions): string;

export type SortDirection = "ascending" | "descending";

export interface Column<Row = Record<string, unknown>> {
  key: string;
  label?: string;
  /** Right-align with tabular figures. */
  numeric?: boolean;
  sortable?: boolean;
  /** Render this column's cells as row headers (th scope="row"). */
  rowHeader?: boolean;
  /** A CSS width such as "8rem" or "20%". */
  width?: string;
  /** Returns text; the result is escaped. */
  format?: (value: any, row: Row) => string | number;
  /** Returns trusted markup, such as a badge. */
  render?: (value: any, row: Row) => string;
}

export interface DataTableOptions<Row = Record<string, unknown>> extends Common {
  columns: Array<Column<Row>>;
  rows?: Row[];
  caption?: string;
  /** Keep the caption for screen readers only. */
  captionHidden?: boolean;
  sort?: { key: string; direction: SortDirection };
  /** When given, sortable headers become links to this URL. */
  sortHref?: (key: string, direction: SortDirection) => string;
  emptyMessage?: string;
  /** A row property, or a function, used for each row's data-key. */
  rowKey?: string | ((row: Row, index: number) => string | number);
  density?: "comfortable" | "compact";
}
export function dataTable<Row = Record<string, unknown>>(options: DataTableOptions<Row>): string;

export type TimelineState = "done" | "current" | "upcoming" | "failed";
export const TIMELINE_STATES: readonly TimelineState[];

export interface TimelineItem {
  title: string;
  state?: TimelineState;
  /** A Date renders a <time datetime>; a string is shown as given. */
  time?: Date | string;
  /** Text shown instead of the formatted time. */
  timeLabel?: string;
  description?: string;
}

export interface TimelineOptions extends Common {
  items: TimelineItem[];
  /** The list's accessible name. Default "Progress". */
  label?: string;
}
export function timeline(options: TimelineOptions): string;

// ---------- Charts ----------

export interface SparklineOptions extends Common {
  /** Missing values (null, NaN) leave a gap. */
  values: Array<number | null | undefined>;
  width?: number;
  height?: number;
  /** Prefix of the accessible name. Default "Trend". */
  label?: string;
  /** Fill under the line. Default true. */
  area?: boolean;
}
export function sparkline(options: SparklineOptions): string;

/** "4 points, from 1 to 5, low 1, high 5". */
export function describeSeries(values: Array<number | null | undefined>): string;

export interface BarChartOptions extends Common {
  title: string;
  data: Array<{ label: string; value: number }>;
  width?: number;
  /** Bar thickness, capped at 24. Default 20. */
  barHeight?: number;
  gap?: number;
  labelWidth?: number;
  formatValue?: (value: number) => string;
  /** Show the data table instead of keeping it for screen readers only. */
  showTable?: boolean;
  emptyMessage?: string;
}
export function barChart(options: BarChartOptions): string;
