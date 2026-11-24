# ligatrix-components

Framework-free UI components for internal tools and dashboards: plain functions that return accessible, escaped HTML strings, plus one themeable stylesheet.

![CI](https://github.com/Ligatrix/ligatrix-components/actions/workflows/ci.yml/badge.svg)

## Why

Most companies run on a handful of internal screens: an order queue, an approvals page, a stock report, a client status page. Those screens rarely justify a front-end framework and its build chain, yet they still need consistent tables, forms and status displays that work with a keyboard and a screen reader, and they must never render a customer's text as markup. This kit gives a server (or a browser) one function per component, returning a string you can send or insert, with escaping, ARIA and theming handled once.

## Quick start

```sh
npm test                        # 101 tests, no install needed
npm run gallery                 # re-renders gallery/index.html
node examples/quick-start.mjs   # prints the markup shown below
```

Then open `gallery/index.html` in a browser to see every component in light and dark.

## Usage

```js
import { metricTile, badge, dataTable } from "@ligatrix/components";

metricTile({ label: "Open orders", value: 1284, delta: 6.4, period: "vs last week" });

dataTable({
  caption: "Purchase orders",
  sort: { key: "value", direction: "descending" },
  columns: [
    { key: "id", label: "Order", rowHeader: true },
    { key: "status", label: "Status", render: (v) => badge({ label: v, status: "warning" }) },
    { key: "value", label: "Value", numeric: true, sortable: true, format: (v) => `$${v.toLocaleString("en-US")}` },
  ],
  rows: [{ id: "PO-10475", status: "On hold", value: 61200 }],
});
```

Output (from `node examples/quick-start.mjs`, wrapped here for reading):

```html
<div class="lx-metric">
  <p class="lx-metric__label">Open orders</p>
  <p class="lx-metric__value">1,284</p>
  <p class="lx-metric__delta lx-metric__delta--good" data-direction="up">
    <span aria-hidden="true">▲ +6.4%</span><span class="lx-sr-only">Up 6.4%</span>
    <span class="lx-metric__period">vs last week</span></p>
</div>
<div class="lx-table-wrap" role="region" aria-label="Purchase orders" tabindex="0">
  <table class="lx-table lx-table--comfortable"><caption>Purchase orders</caption>
    <thead><tr>
      <th scope="col">Order</th><th scope="col">Status</th>
      <th scope="col" class="lx-num lx-table__sortable" aria-sort="descending">
        <button type="button" class="lx-table__sort" data-sort-key="value" data-sort-next="ascending">Value<span
          class="lx-table__sort-icon" data-state="descending" aria-hidden="true"></span></button></th>
    </tr></thead>
    <tbody><tr>
      <th scope="row">PO-10475</th>
      <td><span class="lx-badge lx-badge--warning"><span class="lx-badge__dot" aria-hidden="true"></span>On hold</span></td>
      <td class="lx-num">$61,200</td>
    </tr></tbody>
  </table>
</div>
```

Rendered with the stylesheet, this is a white tile reading « Open orders », a large « 1,284 » and a green « ▲ +6.4% vs last week »
(a screen reader hears « Up 6.4% »), followed by a bordered table whose Value column is right-aligned in tabular figures, with a
highlighted descending-sort arrow and an amber « On hold » status pill.

Hostile text is always inert:

```js
badge({ label: "<img src=x onerror=alert(1)>", status: "danger" });
// <span class="lx-badge lx-badge--danger"><span class="lx-badge__dot" aria-hidden="true"></span>&lt;img src=x onerror=alert(1)&gt;</span>
```

Include the stylesheet once per page:

```html
<link rel="stylesheet" href="node_modules/@ligatrix/components/styles/ligatrix-components.css">
```

### Conventions

- Every component takes one options object and returns a string.
- Text options are escaped. Options ending in `Html` (`bodyHtml`, `actionsHtml`, `footerHtml`, `messageHtml`, `iconHtml`) and a
  table column's `render()` take markup you trust, usually another component.
- `className` adds classes and `attrs` adds attributes to the root element. Attribute names are validated, `on*` event handlers
  throw, and `href`/`src` values pass through `safeUrl`, which turns `javascript:`, `data:` and similar into `#`.
- Invalid options (an unknown variant, a heading level of 7, duplicate column keys) throw a `TypeError` or `RangeError` naming
  the option, rather than rendering something wrong.
- Ids for ARIA wiring come from a counter; call `resetIds()` at the start of each server response for stable output, or pass `id`.

## Components

| Function | What it renders |
| --- | --- |
| `button` | A button in four variants and three sizes, or a link styled as one; disabled and loading states set the right attributes. |
| `badge` | A status pill (`neutral`, `info`, `success`, `warning`, `danger`) whose text carries the meaning, colour only reinforcing it. |
| `metricTile` | A headline value with a signed delta coloured by direction and `upIsGood`, the direction spelled out for screen readers, and an optional trend line. |
| `dataTable` | A table from a columns config: numeric right-alignment, `aria-sort` and sort controls (buttons or links), row headers, empty state, missing-cell marking. |
| `formField` | A labelled input or textarea with hint, error (`aria-invalid`, `aria-describedby`) and a required marker in text. |
| `select` | A labelled native select with placeholder, option groups, disabled options, multiple selection, hint and error. |
| `timeline` | An ordered list of steps (`done`, `current`, `upcoming`, `failed`) with `aria-current="step"` and machine-readable times. |
| `alert` | An inline message; warning and danger use `role="alert"`, info and success `role="status"`; optionally dismissible. |
| `card` | A titled section labelled by its heading, with subtitle, actions, body and footer. |
| `pagination` | A labelled nav with first, last and neighbouring pages, gaps, Previous/Next disabled at the edges, `aria-current="page"`. |
| `emptyState` | A placeholder for an empty view with a heading, a short explanation and the next step. |
| `sparkline` | A compact SVG trend line with the latest point marked, gaps for missing values and a spoken summary of the range. |
| `barChart` | A horizontal SVG bar chart from a zero baseline (negatives grow left), values at the bar ends and the same numbers as a table. |

Helpers: `escapeHtml`, `attrs`, `safeUrl`, `cx`, `uid`, `resetIds`, `pageRange`, `describeSeries`, `formatCompact`, `formatNumber`.
Types for all of them are in `src/index.d.ts`.

## Theming

Every visual decision is a CSS custom property in `styles/ligatrix-components.css`:

| Group | Tokens |
| --- | --- |
| Colour | `--lx-color-bg`, `-surface`, `-surface-raised`, `-border`, `-text`, `-text-secondary`, `-text-muted`, `-accent`, `-info`, `-success`, `-warning`, `-danger` (each status with a `-soft` tint), `-chart-1`, `-chart-negative` |
| Spacing | `--lx-space-1` to `--lx-space-10` on a 4px base |
| Radius | `--lx-radius-sm`, `-md`, `-lg`, `-full` |
| Type | `--lx-font-sans`, `--lx-font-mono`, `--lx-text-xs` to `--lx-text-3xl`, `--lx-leading-*`, `--lx-weight-*` |

Light values are the default; dark values apply under `prefers-color-scheme: dark`. Set `data-theme="light"` or `data-theme="dark"`
on the `html` element to force one. The tokens sit in a cascade layer (`@layer ligatrix-tokens`), so any ordinary rule of yours
overrides them in both modes, whatever its specificity:

```css
:root { --lx-color-accent: #0f766e; --lx-color-accent-hover: #115e59; --lx-radius-md: 4px; }
@media (prefers-color-scheme: dark) { :root { --lx-color-accent: #2dd4bf; } }
```

Tokens can also be overridden on any container to theme one region of a page.

## Design notes

- **Strings, not a virtual DOM.** Internal tools are mostly server-rendered pages. Returning strings keeps the kit usable from any
  Node server, a static generator or `innerHTML`, with no runtime and nothing to hydrate. The cost is that behaviour (sorting,
  dismissing) is the page's job; the kit renders the state and exposes `data-sort-key`/`data-sort-next` or links to act on.
- **Escape by default, trust by name.** Every text option is escaped; only options whose name ends in `Html` are inserted raw. The
  dangerous path is visible at the call site and easy to grep for.
- **Fail loudly on bad options.** An unknown variant throws instead of silently rendering an unstyled element, so mistakes surface
  in tests rather than in production screens.
- **Native elements first.** `select` is a native select and the table is a real table, so keyboard support, form submission and
  screen reader behaviour come from the platform rather than from custom scripting.
- **Charts stay small and honest.** Bars start at zero, negative values grow the other way, numbers are printed beside the marks,
  and the SVG is hidden from assistive technology in favour of a real data table. For axes, legends and many series, use a charting
  library; these two cover the tile-and-summary cases that most dashboards need.

## Testing

```sh
npm test       # node:test, 101 tests
npm run lint   # whitespace and final-newline checks on tracked files
```

The suite covers rendering, ARIA wiring, option validation and edge cases (empty tables, negative and zero deltas, missing values,
single-page pagination, gaps in a series). `test/injection.test.mjs` feeds hostile input to every text option of every component and
parses the output tag by tag to prove no element, event handler or `javascript:` URL gets through. It also checks that the
committed gallery matches the source and that `index.d.ts` declares exactly what `index.mjs` exports.

## Licence

MIT. See [LICENSE](LICENSE).

---
Built and maintained by the [Ligatrix](https://ligatrix.com) team. We build systems like this for companies: [book a call](https://ligatrix.com/contact/sales).
