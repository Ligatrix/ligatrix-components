// Every component, every text option, fed hostile input. The output must
// parse as well-formed tags only, with no script-capable element, no
// event handler attribute and no javascript: URL.

import { test } from "node:test";
import assert from "node:assert/strict";
import * as lx from "../src/index.mjs";
import { scanTags } from "./helpers.mjs";

const PAYLOADS = [
  `<script>alert(1)</script>`,
  `"><img src=x onerror=alert(1)>`,
  `' onmouseover='alert(1)`,
  `\` onfocus=\`alert(1)`,
  `</textarea><svg onload=alert(1)>`,
  `<!-- -->`,
  `&lt;script&gt;`,
];

const FORBIDDEN_TAGS = new Set(["script", "img", "iframe", "object", "embed", "style", "link", "meta", "base", "form"]);

function assertSafe(html, where) {
  let tags;
  try {
    tags = scanTags(html);
  } catch (error) {
    assert.fail(`${where}: ${error.message}`);
  }
  for (const tag of tags) {
    assert.ok(!FORBIDDEN_TAGS.has(tag.name), `${where}: unexpected <${tag.name}>`);
    for (const [name, value] of Object.entries(tag.attrs)) {
      assert.ok(!/^on/i.test(name), `${where}: event handler ${name}`);
      if (typeof value === "string" && /^(href|src)$/.test(name)) {
        assert.ok(!/^\s*javascript:/i.test(value), `${where}: ${name}=${value}`);
      }
    }
  }
}

const renderers = {
  button: (p) => lx.button({ label: p, ariaLabel: p, href: p }),
  "button (as button)": (p) => lx.button({ label: p, ariaLabel: p }),
  badge: (p) => lx.badge({ label: p }),
  alert: (p) => lx.alert({ title: p, message: p, attrs: { "data-x": p } }),
  card: (p) => lx.card({ title: p, subtitle: p, body: p, id: p }),
  emptyState: (p) => lx.emptyState({ title: p, message: p }),
  pagination: (p) => lx.pagination({ page: 2, pageCount: 3, label: p, href: `${p}{page}` }),
  metricTile: (p) => lx.metricTile({ label: p, value: p, delta: -1, period: p, deltaSuffix: p, trend: [1, 2] }),
  dataTable: (p) =>
    lx.dataTable({
      caption: p,
      emptyMessage: p,
      rowKey: "a",
      sort: { key: p, direction: "ascending" },
      sortHref: (k) => `?s=${k}`,
      columns: [{ key: p, label: p, sortable: true }, { key: "a", label: p, numeric: true }],
      rows: [{ [p]: p, a: p }],
    }),
  "dataTable (empty)": (p) => lx.dataTable({ caption: p, emptyMessage: p, columns: [{ key: "a", label: p }], rows: [] }),
  formField: (p) => lx.formField({ label: p, name: p, id: p, value: p, placeholder: p, hint: p, error: p, autocomplete: p }),
  textarea: (p) => lx.formField({ label: p, type: "textarea", value: p }),
  select: (p) =>
    lx.select({ label: p, name: p, id: p, placeholder: p, hint: p, error: p, value: p, options: [p, { value: p, label: p }, { label: p, options: [p] }] }),
  timeline: (p) => lx.timeline({ label: p, items: [{ title: p, description: p, time: p, state: "current" }, { title: p, timeLabel: p, time: new Date(0) }] }),
  sparkline: (p) => lx.sparkline({ values: [1, 2, 3], label: p }),
  barChart: (p) => lx.barChart({ title: p, emptyMessage: p, data: [{ label: p, value: 3 }, { label: p, value: -1 }] }),
  "barChart (empty)": (p) => lx.barChart({ title: p, emptyMessage: p, data: [] }),
};

for (const [name, render] of Object.entries(renderers)) {
  test(`${name} escapes hostile text in every option`, () => {
    for (const payload of PAYLOADS) {
      const html = render(payload);
      assertSafe(html, `${name} with ${JSON.stringify(payload)}`);
      assert.ok(!html.includes(payload) || !/[<>"'`]/.test(payload), `${name}: raw payload in output`);
    }
  });
}

test("a payload in a URL option never yields a javascript: link", () => {
  for (const href of ["javascript:alert(1)", " JAVASCRIPT:alert(1)", "java\u0000script:alert(1)", "data:text/html;base64,PHNjcmlwdD4="]) {
    assertSafe(lx.button({ label: "x", href }), href);
    assert.match(lx.button({ label: "x", href }), /href="#"/);
  }
});

test("caller attributes cannot smuggle in an event handler", () => {
  assert.throws(() => lx.badge({ label: "x", attrs: { onclick: "alert(1)" } }), TypeError);
  assert.throws(() => lx.formField({ label: "x", inputAttrs: { onfocus: "alert(1)" } }), TypeError);
  assert.throws(() => lx.card({ title: "x", attrs: { "x onload": "1" } }), TypeError);
});

test("a hostile column width cannot break out of the style attribute", () => {
  const html = lx.dataTable({ columns: [{ key: "a", width: `10px;background:url(javascript:x)"><script>` }], rows: [] });
  assertSafe(html, "width");
  assert.match(html, /style="width:10pxbackgroundurljavascriptxscript"/);
});
