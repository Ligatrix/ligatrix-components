#!/usr/bin/env node
// Renders every component with sample data into gallery/index.html, a
// single self-contained page (the stylesheet is inlined).
//
//   npm run gallery          write gallery/index.html
//   npm run gallery -- --check   exit 1 if the committed file is out of date

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as lx from "../src/index.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = join(root, "gallery", "index.html");

const COMPANY = "Corvane Supply Co., a fictional distributor used in this demo";

const orders = [
  { id: "PO-10482", depot: "North depot", status: "Shipped", lines: 14, value: 18240.5, due: "2026-11-26" },
  { id: "PO-10479", depot: "Harbour depot", status: "Awaiting approval", lines: 6, value: 4310, due: "2026-11-27" },
  { id: "PO-10475", depot: "East depot", status: "On hold", lines: 22, value: 61200, due: "2026-11-25" },
  { id: "PO-10471", depot: "North depot", status: "Draft", lines: 3, value: 890.25, due: "" },
  { id: "PO-10466", depot: "Harbour depot", status: "Cancelled", lines: 9, value: 7725, due: "2026-11-22" },
];

const STATUS_TONE = {
  Shipped: "success",
  "Awaiting approval": "info",
  "On hold": "warning",
  Draft: "neutral",
  Cancelled: "danger",
};

const money = (n) => `$${lx.formatNumber(n)}`;

function section(id, title, description, html) {
  return (
    `<section class="g-section" id="${id}" aria-labelledby="${id}-h">` +
    `<h2 id="${id}-h">${lx.escapeHtml(title)}</h2>` +
    `<p class="g-desc">${lx.escapeHtml(description)}</p>` +
    `<div class="g-demo">${html}</div>` +
    `</section>`
  );
}

const row = (...items) => `<div class="g-row">${items.join("")}</div>`;
const stack = (...items) => `<div class="g-stack g-stack--wide">${items.join("")}</div>`;
const grid = (...items) => `<div class="g-grid">${items.join("")}</div>`;

export function renderSections() {
  lx.resetIds();
  const sections = [];

  sections.push(
    section(
      "button",
      "Button",
      "Four variants and three sizes. A button with href renders a link; disabled and loading states set the right attributes.",
      row(
        lx.button({ label: "Approve order" }),
        lx.button({ label: "Export CSV", variant: "secondary" }),
        lx.button({ label: "View history", variant: "ghost" }),
        lx.button({ label: "Cancel order", variant: "danger" }),
      ) +
        row(
          lx.button({ label: "Small", size: "sm", variant: "secondary" }),
          lx.button({ label: "Large", size: "lg" }),
          lx.button({ label: "Saving", loading: true }),
          lx.button({ label: "Disabled", disabled: true, variant: "secondary" }),
          lx.button({ label: "Open as link", href: "#data-table", variant: "ghost" }),
        ),
    ),
  );

  sections.push(
    section(
      "badge",
      "Badge",
      "Status labels. The word carries the meaning; the dot and tint only reinforce it.",
      row(
        lx.badge({ label: "Draft" }),
        lx.badge({ label: "Awaiting approval", status: "info" }),
        lx.badge({ label: "Shipped", status: "success" }),
        lx.badge({ label: "On hold", status: "warning" }),
        lx.badge({ label: "Cancelled", status: "danger" }),
        lx.badge({ label: "No dot", status: "info", dot: false }),
      ),
    ),
  );

  sections.push(
    section(
      "metric-tile",
      "Metric tile",
      "A headline value with a signed change. Colour follows direction and whether up is good; the direction is also written out for screen readers.",
      grid(
        lx.metricTile({ label: "Open orders", value: 1284, delta: 6.4, period: "vs last week", trend: [980, 1010, 1060, 1040, 1120, 1150, 1130, 1190, 1210, 1240, 1262, 1284] }),
        lx.metricTile({ label: "Revenue this month", value: "$4.2M", delta: -3.1, period: "vs October", trend: [4.6, 4.5, 4.55, 4.4, 4.38, 4.3, 4.25, 4.2] }),
        lx.metricTile({ label: "Late shipments", value: 37, delta: -12, period: "vs last week", upIsGood: false }),
        lx.metricTile({ label: "Average lines per order", value: 11.8, delta: 0, period: "vs last week" }),
      ),
    ),
  );

  sections.push(
    section(
      "data-table",
      "Data table",
      `Purchase orders for ${COMPANY}. Numeric columns are right-aligned with tabular figures; the sorted column sets aria-sort; missing values read as "Empty".`,
      lx.dataTable({
        caption: "Purchase orders",
        sort: { key: "value", direction: "descending" },
        sortHref: (key, direction) => `?sort=${key}&dir=${direction}`,
        rowKey: "id",
        columns: [
          { key: "id", label: "Order", sortable: true, rowHeader: true },
          { key: "depot", label: "Depot", sortable: true },
          { key: "status", label: "Status", render: (v) => lx.badge({ label: v, status: STATUS_TONE[v] ?? "neutral" }) },
          { key: "lines", label: "Lines", numeric: true, sortable: true },
          { key: "value", label: "Value", numeric: true, sortable: true, format: (v) => money(v) },
          { key: "due", label: "Due", sortable: true },
        ],
        rows: orders,
      }) +
        `<h3 class="g-sub">Empty</h3>` +
        lx.dataTable({
          caption: "Returns this week",
          columns: [
            { key: "id", label: "Return" },
            { key: "reason", label: "Reason" },
            { key: "value", label: "Value", numeric: true },
          ],
          rows: [],
          emptyMessage: "No returns logged this week.",
        }),
    ),
  );

  sections.push(
    section(
      "form-field",
      "Form field",
      "Labels are always visible and linked. Hints and errors are wired with aria-describedby; required fields are marked in text as well as with an asterisk.",
      grid(
        lx.formField({ label: "Supplier reference", name: "ref", hint: "As printed on the supplier's invoice.", placeholder: "e.g. INV-2291" }),
        lx.formField({ label: "Contact email", name: "email", type: "email", required: true, value: "dana@corvane", error: "Enter a full email address, like dana@corvane.example." }),
        lx.formField({ label: "Quantity", name: "qty", type: "number", value: "24", required: true }),
        lx.formField({ label: "Notes for the warehouse", name: "notes", type: "textarea", hint: "Visible to the picking team." }),
      ),
    ),
  );

  sections.push(
    section(
      "select",
      "Select",
      "A native select, so keyboard and screen reader support come from the platform. Supports placeholders, groups, disabled options and errors.",
      grid(
        lx.select({
          label: "Depot",
          name: "depot",
          placeholder: "Choose a depot",
          required: true,
          options: ["North depot", "East depot", "Harbour depot", { value: "west", label: "West depot (closed)", disabled: true }],
        }),
        lx.select({
          label: "Approver",
          name: "approver",
          value: "dana",
          hint: "Orders over $10,000 need a second approver.",
          options: [
            { label: "Purchasing", options: [{ value: "dana", label: "Dana" }, { value: "sam", label: "Sam" }] },
            { label: "Finance", options: [{ value: "priya", label: "Priya" }] },
          ],
        }),
        lx.select({ label: "Carrier", name: "carrier", placeholder: "Choose a carrier", options: ["Road freight", "Rail freight"], error: "Choose a carrier before booking." }),
      ),
    ),
  );

  sections.push(
    section(
      "timeline",
      "Status timeline",
      "An ordered list of steps. The current step carries aria-current; each state is written out for screen readers.",
      lx.timeline({
        label: "Order PO-10475 progress",
        items: [
          { title: "Order raised", state: "done", time: new Date("2026-11-20T09:14:00Z"), description: "Raised by Sam from the East depot reorder list." },
          { title: "Approved", state: "done", time: new Date("2026-11-20T15:02:00Z"), description: "Approver: Dana." },
          { title: "Credit check", state: "failed", time: new Date("2026-11-21T08:40:00Z"), description: "Account over limit; placed on hold." },
          { title: "Awaiting finance review", state: "current", timeLabel: "Since 21 Nov, 8:45 AM UTC" },
          { title: "Picked and packed", state: "upcoming" },
          { title: "Shipped", state: "upcoming" },
        ],
      }),
    ),
  );

  sections.push(
    section(
      "alert",
      "Alert",
      "Info and success are polite (role=status); warning and danger interrupt (role=alert).",
      `<div class="g-stack">` +
        lx.alert({ tone: "info", title: "Stock count scheduled", message: "The East depot is counted on Friday; orders from it ship on Monday." }) +
        lx.alert({ tone: "success", message: "PO-10482 was shipped and the customer notified." }) +
        lx.alert({ tone: "warning", title: "Approval overdue", message: "PO-10479 has waited more than 24 hours for approval.", dismissible: true }) +
        lx.alert({ tone: "danger", title: "Sync failed", message: "The carrier feed returned an error. Tracking numbers may be out of date." }) +
        `</div>`,
    ),
  );

  sections.push(
    section(
      "card",
      "Card",
      "A titled surface. Text options are escaped; the *Html options take other components.",
      grid(
        lx.card({
          title: "Reorder suggestions",
          subtitle: "North depot",
          body: "Twelve products are below their reorder point. The suggested order totals $8,410.",
          actionsHtml: lx.button({ label: "Review", size: "sm", variant: "secondary" }),
          footerHtml: "Updated 9:30 AM",
        }),
        lx.card({
          title: "Depot health",
          bodyHtml:
            `<div class="g-row">` +
            lx.badge({ label: "North: normal", status: "success" }) +
            lx.badge({ label: "East: on hold", status: "warning" }) +
            lx.badge({ label: "Harbour: normal", status: "success" }) +
            `</div>`,
        }),
      ),
    ),
  );

  sections.push(
    section(
      "pagination",
      "Pagination",
      "A labelled nav with the current page marked. Gaps collapse long ranges; the first and last pages are always reachable.",
      `<div class="g-stack">` +
        lx.pagination({ page: 1, pageCount: 4, href: "#pagination" }) +
        lx.pagination({ page: 6, pageCount: 24, href: "#pagination" }) +
        lx.pagination({ page: 24, pageCount: 24, href: "#pagination" }) +
        `</div>`,
    ),
  );

  sections.push(
    section(
      "empty-state",
      "Empty state",
      "What a view shows when there is nothing in it yet, with the next useful step.",
      lx.emptyState({
        title: "No supplier invoices yet",
        message: "Invoices appear here once a supplier sends one or you upload a PDF.",
        actionHtml: lx.button({ label: "Upload invoice", variant: "secondary" }),
      }),
    ),
  );

  sections.push(
    section(
      "sparkline",
      "Sparkline",
      "A compact trend with the latest point marked. Gaps in the data stay gaps. The accessible name states the range in words.",
      row(
        lx.sparkline({ values: [12, 14, 13, 17, 16, 19, 22, 21, 24, 23, 27, 29], label: "Daily orders" }),
        lx.sparkline({ values: [30, 28, 29, 24, null, null, 20, 18, 19, 15], label: "Backlog with missing days" }),
        lx.sparkline({ values: [5, 5, 5, 5, 5], label: "Flat series" }),
        lx.sparkline({ values: [], label: "No data" }),
      ),
    ),
  );

  sections.push(
    section(
      "bar-chart",
      "Bar chart",
      "Horizontal bars from a zero baseline, values printed at the bar ends, the same numbers in a table for assistive technology.",
      stack(
        lx.barChart({
          title: "Units shipped by depot, November",
          data: [
            { label: "North depot", value: 18420 },
            { label: "East depot", value: 12960 },
            { label: "Harbour depot", value: 9310 },
            { label: "West depot", value: 2140 },
          ],
        }),
        lx.barChart({
          title: "Stock change by category, this week",
          formatValue: (v) => `${v > 0 ? "+" : ""}${lx.formatNumber(v)}`,
          showTable: true,
          data: [
            { label: "Fasteners", value: 420 },
            { label: "Hand tools", value: -135 },
            { label: "Safety wear", value: 260 },
            { label: "Adhesives", value: -60 },
          ],
        }),
      ),
    ),
  );

  return sections;
}

const PAGE_CSS = `
body { margin: 0; background: var(--lx-color-bg); color: var(--lx-color-text); font-family: var(--lx-font-sans); line-height: var(--lx-leading-normal); }
.g-header { padding: var(--lx-space-8) var(--lx-space-6) var(--lx-space-6); max-width: 1100px; margin: 0 auto; display: flex; justify-content: space-between; align-items: flex-end; gap: var(--lx-space-4); flex-wrap: wrap; }
.g-header h1 { margin: 0; font-size: var(--lx-text-3xl); line-height: var(--lx-leading-tight); }
.g-header p { margin: var(--lx-space-2) 0 0; color: var(--lx-color-text-secondary); max-width: 60ch; }
.g-layout { max-width: 1100px; margin: 0 auto; padding: 0 var(--lx-space-6) var(--lx-space-10); display: grid; grid-template-columns: 200px 1fr; gap: var(--lx-space-8); }
.g-nav { position: sticky; top: var(--lx-space-4); align-self: start; font-size: var(--lx-text-sm); }
.g-nav ul { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--lx-space-1); }
.g-nav a { color: var(--lx-color-text-secondary); text-decoration: none; display: block; padding: var(--lx-space-1) var(--lx-space-2); border-radius: var(--lx-radius-sm); }
.g-nav a:hover { color: var(--lx-color-text); background: var(--lx-color-surface-sunken); }
.g-section { padding: var(--lx-space-6) 0; border-top: 1px solid var(--lx-color-border); }
.g-section h2 { margin: 0; font-size: var(--lx-text-xl); }
.g-desc { margin: var(--lx-space-1) 0 var(--lx-space-4); color: var(--lx-color-text-secondary); font-size: var(--lx-text-sm); max-width: 70ch; }
.g-sub { margin: var(--lx-space-6) 0 var(--lx-space-3); font-size: var(--lx-text-md); }
.g-demo { background: var(--lx-color-surface); border: 1px solid var(--lx-color-border); border-radius: var(--lx-radius-lg); padding: var(--lx-space-5); }
.g-row { display: flex; flex-wrap: wrap; gap: var(--lx-space-3); align-items: center; }
.g-row + .g-row { margin-top: var(--lx-space-4); }
.g-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--lx-space-4); }
.g-stack { display: grid; gap: var(--lx-space-3); }
.g-stack--wide { gap: var(--lx-space-8); }
.g-theme { display: flex; gap: var(--lx-space-2); }
.g-theme [aria-pressed="true"] { background: var(--lx-color-accent-soft); border-color: var(--lx-color-accent); }
.g-footer { max-width: 1100px; margin: 0 auto; padding: var(--lx-space-6); color: var(--lx-color-text-muted); font-size: var(--lx-text-sm); border-top: 1px solid var(--lx-color-border); }
.g-footer a { color: var(--lx-color-accent); }
@media (max-width: 760px) { .g-layout { grid-template-columns: 1fr; } .g-nav { position: static; } }
`;

const THEME_SCRIPT = `
document.querySelectorAll("[data-set-theme]").forEach(function (b) {
  b.addEventListener("click", function () {
    var t = b.getAttribute("data-set-theme");
    if (t === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
    document.querySelectorAll("[data-set-theme]").forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
  });
});
`;

export async function renderGallery() {
  const css = await readFile(join(root, "styles", "ligatrix-components.css"), "utf8");
  const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  const sections = renderSections();
  const nav = sections
    .map((s) => {
      const id = /id="([^"]+)"/.exec(s)[1];
      const title = /<h2[^>]*>([^<]+)<\/h2>/.exec(s)[1];
      return `<li><a href="#${id}">${title}</a></li>`;
    })
    .join("");
  const themeButton = (value, label, pressed) =>
    lx.button({ label, size: "sm", variant: "secondary", attrs: { "data-set-theme": value, "aria-pressed": pressed ? "true" : "false" } });
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ligatrix-components ${lx.escapeHtml(pkg.version)}: gallery</title>
<style>
${css}
${PAGE_CSS.trim()}
</style>
</head>
<body>
<header class="g-header">
<div>
<h1>ligatrix-components</h1>
<p>Every component in the kit, rendered by <code>npm run gallery</code> from the same functions you import. Sample data is for ${lx.escapeHtml(COMPANY)}.</p>
</div>
<div class="g-theme" role="group" aria-label="Colour theme">${themeButton("system", "System", true)}${themeButton("light", "Light", false)}${themeButton("dark", "Dark", false)}</div>
</header>
<div class="g-layout">
<nav class="g-nav" aria-label="Components"><ul>${nav}</ul></nav>
<main>
${sections.join("\n")}
</main>
</div>
<footer class="g-footer">Version ${lx.escapeHtml(pkg.version)}. Built and maintained by the <a href="https://ligatrix.com">Ligatrix</a> team.</footer>
<script>${THEME_SCRIPT.trim()}</script>
</body>
</html>
`;
}

async function main() {
  const html = await renderGallery();
  if (process.argv.includes("--check")) {
    const current = await readFile(outFile, "utf8").catch(() => "");
    if (current !== html) {
      console.error("gallery/index.html is out of date. Run: npm run gallery");
      process.exit(1);
    }
    console.log("gallery/index.html is up to date.");
    return;
  }
  await writeFile(outFile, html);
  console.log(`Wrote gallery/index.html (${sections()} components, ${Buffer.byteLength(html)} bytes)`);
}

function sections() {
  return renderSections().length;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
