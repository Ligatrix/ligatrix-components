import { test } from "node:test";
import assert from "node:assert/strict";
import { metricTile, dataTable, timeline, badge } from "../src/index.mjs";

test("metricTile shows a positive delta as up and good", () => {
  const html = metricTile({ label: "Orders", value: 1284, delta: 6.4, period: "vs last week" });
  assert.match(html, /<p class="lx-metric__value">1,284<\/p>/);
  assert.match(html, /lx-metric__delta--good" data-direction="up"/);
  assert.match(html, /▲ \+6\.4%/);
  assert.match(html, /<span class="lx-sr-only">Up 6\.4%<\/span>/);
  assert.match(html, /vs last week/);
});

test("metricTile shows a negative delta as down, with a true minus sign", () => {
  const html = metricTile({ label: "Revenue", value: "$4.2M", delta: -3.1 });
  assert.match(html, /lx-metric__delta--bad" data-direction="down"/);
  assert.match(html, /▼ −3\.1%/);
  assert.match(html, />Down 3\.1%</);
});

test("metricTile flips the tone when down is good", () => {
  assert.match(metricTile({ label: "Late", value: 37, delta: -12, upIsGood: false }), /lx-metric__delta--good/);
  assert.match(metricTile({ label: "Late", value: 37, delta: 4, upIsGood: false }), /lx-metric__delta--bad/);
});

test("metricTile treats a zero delta as no change", () => {
  const html = metricTile({ label: "Lines", value: 11.8, delta: 0 });
  assert.match(html, /lx-metric__delta--neutral" data-direction="flat"/);
  assert.match(html, />No change</);
});

test("metricTile compacts large values and omits the delta when absent", () => {
  const html = metricTile({ label: "Units", value: 4_250_000 });
  assert.match(html, />4\.3M</);
  assert.doesNotMatch(html, /lx-metric__delta/);
});

test("metricTile rejects a non-numeric delta and a missing label", () => {
  assert.throws(() => metricTile({ label: "x", value: 1, delta: "lots" }), TypeError);
  assert.throws(() => metricTile({ value: 1 }), /label is required/);
});

test("metricTile renders a labelled trend line", () => {
  assert.match(metricTile({ label: "Orders", value: 3, trend: [1, 2, 3] }), /role="img" aria-label="Orders trend: 3 points/);
});

const columns = [
  { key: "id", label: "Order", sortable: true, rowHeader: true },
  { key: "depot", label: "Depot" },
  { key: "value", label: "Value", numeric: true, sortable: true, format: (v) => `$${v}` },
];

test("dataTable right-aligns numeric columns in the header and the body", () => {
  const html = dataTable({ columns, rows: [{ id: "A1", depot: "North", value: 10 }] });
  assert.match(html, /<th scope="col" class="lx-num lx-table__sortable" aria-sort="none">/);
  assert.match(html, /<td class="lx-num">\$10<\/td>/);
});

test("dataTable sets aria-sort on the sorted column and offers the opposite direction", () => {
  const html = dataTable({ columns, rows: [], sort: { key: "id", direction: "ascending" } });
  assert.match(html, /aria-sort="ascending"><button type="button" class="lx-table__sort" data-sort-key="id" data-sort-next="descending">/);
  assert.match(html, /aria-sort="none"><button[^>]*data-sort-key="value" data-sort-next="ascending"/);
});

test("dataTable renders sort links when sortHref is given", () => {
  const html = dataTable({ columns, rows: [], sort: { key: "value", direction: "descending" }, sortHref: (k, d) => `?sort=${k}&dir=${d}` });
  assert.match(html, /<a class="lx-table__sort" href="\?sort=value&amp;dir=ascending">/);
});

test("dataTable renders a full-width empty row when there are no rows", () => {
  const html = dataTable({ columns, rows: [], emptyMessage: "No orders yet." });
  assert.match(html, /<tr class="lx-table__empty"><td colspan="3">/);
  assert.match(html, /No orders yet\./);
});

test("dataTable marks missing cells as empty for screen readers", () => {
  const html = dataTable({ columns: [{ key: "a" }, { key: "b" }], rows: [{ a: "x" }] });
  assert.match(html, /<td><span aria-hidden="true">—<\/span><span class="lx-sr-only">Empty<\/span><\/td>/);
});

test("dataTable uses row headers and row keys", () => {
  const html = dataTable({ columns, rows: [{ id: "A1", depot: "N", value: 1 }], rowKey: "id" });
  assert.match(html, /<tr data-key="A1"><th scope="row">A1<\/th>/);
});

test("dataTable passes render() output through and escapes format() output", () => {
  const html = dataTable({
    columns: [
      { key: "s", render: (v) => badge({ label: v, status: "success" }) },
      { key: "t", format: (v) => `<${v}>` },
    ],
    rows: [{ s: "Shipped", t: "x" }],
  });
  assert.match(html, /<span class="lx-badge lx-badge--success">/);
  assert.match(html, /&lt;x&gt;/);
});

test("dataTable labels a captioned table as a focusable scroll region", () => {
  const html = dataTable({ columns, rows: [], caption: "Orders" });
  assert.match(html, /<div class="lx-table-wrap" role="region" aria-label="Orders" tabindex="0">/);
  assert.match(html, /<caption>Orders<\/caption>/);
  assert.match(dataTable({ columns, rows: [], caption: "Orders", captionHidden: true }), /<caption class="lx-sr-only">/);
});

test("dataTable validates columns and sort", () => {
  assert.throws(() => dataTable({ columns: [] }), TypeError);
  assert.throws(() => dataTable({ columns: [{ label: "x" }] }), /string key/);
  assert.throws(() => dataTable({ columns: [{ key: "a" }, { key: "a" }] }), /duplicate/);
  assert.throws(() => dataTable({ columns, sort: { key: "id", direction: "up" } }), RangeError);
});

test("dataTable keeps zero and false values instead of treating them as missing", () => {
  const html = dataTable({ columns: [{ key: "n", numeric: true }, { key: "b" }], rows: [{ n: 0, b: false }] });
  assert.match(html, /<td class="lx-num">0<\/td><td>false<\/td>/);
});

test("timeline marks the current step and states every step in words", () => {
  const html = timeline({
    label: "Order progress",
    items: [
      { title: "Raised", state: "done" },
      { title: "Review", state: "current" },
      { title: "Ship", state: "upcoming" },
      { title: "Credit", state: "failed" },
    ],
  });
  assert.match(html, /^<ol class="lx-timeline" aria-label="Order progress">/);
  assert.equal(html.match(/aria-current="step"/g).length, 1);
  for (const word of ["Completed", "In progress", "Not started", "Failed"]) assert.match(html, new RegExp(`\\(${word}\\)`));
});

test("timeline renders Date times as machine-readable time elements", () => {
  const html = timeline({ items: [{ title: "x", state: "done", time: new Date("2026-11-20T09:14:00Z") }] });
  assert.match(html, /<time class="lx-timeline__time" datetime="2026-11-20T09:14:00.000Z">2026-11-20 09:14 UTC<\/time>/);
});

test("timeline shows a time label without a date and rejects unknown states", () => {
  assert.match(timeline({ items: [{ title: "x", state: "current", timeLabel: "Since Friday" }] }), />Since Friday</);
  assert.throws(() => timeline({ items: [{ title: "x", state: "lost" }] }), RangeError);
  assert.equal(timeline({ items: [] }), '<ol class="lx-timeline" aria-label="Progress"></ol>');
});
