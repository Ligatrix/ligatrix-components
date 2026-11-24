import { test } from "node:test";
import assert from "node:assert/strict";
import { sparkline, barChart, describeSeries } from "../src/index.mjs";

const pathData = (html, cls) => new RegExp(`class="${cls}" d="([^"]*)"`).exec(html)?.[1];

test("sparkline is an image with a spoken summary of the range", () => {
  const html = sparkline({ values: [3, 1, 4], label: "Orders" });
  assert.match(html, /role="img" aria-label="Orders: 3 points, from 3 to 4, low 1, high 4"/);
  assert.match(html, /viewBox="0 0 120 32"/);
});

test("sparkline maps the maximum to the top and the minimum to the bottom", () => {
  const d = pathData(sparkline({ values: [0, 10], width: 100, height: 20, area: false }), "lx-sparkline__line");
  assert.equal(d, "M3 17 L97 3");
});

test("sparkline draws a flat series across the middle", () => {
  const d = pathData(sparkline({ values: [5, 5, 5], width: 100, height: 20 }), "lx-sparkline__line");
  assert.equal(d, "M3 10 L50 10 L97 10");
});

test("sparkline breaks the line at missing values", () => {
  const d = pathData(sparkline({ values: [1, 2, null, 3, 4], area: false }), "lx-sparkline__line");
  assert.equal(d.match(/M/g).length, 2);
});

test("sparkline handles empty and single-point series", () => {
  const empty = sparkline({ values: [] });
  assert.match(empty, /aria-label="Trend: no data"/);
  assert.match(empty, /lx-sparkline__empty/);
  const one = sparkline({ values: [7], width: 40, height: 10 });
  assert.match(one, /<circle class="lx-sparkline__point" cx="20" cy="5"/);
});

test("sparkline rejects bad dimensions", () => {
  assert.throws(() => sparkline({ values: [1], width: 0 }), RangeError);
  assert.throws(() => sparkline({ values: "1,2" }), TypeError);
});

test("describeSeries ignores non-finite values", () => {
  assert.equal(describeSeries([NaN, 2, Infinity, 1000]), "2 points, from 2 to 1,000, low 2, high 1,000");
});

test("barChart draws one bar per item and an equivalent data table", () => {
  const html = barChart({ title: "Units", data: [{ label: "North", value: 10 }, { label: "East", value: 5 }] });
  assert.equal(html.match(/class="lx-chart__bar"/g).length, 2);
  assert.match(html, /<figcaption class="lx-chart__title">Units<\/figcaption>/);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /<table class="lx-sr-only">.*<th scope="row">North<\/th><td class="lx-num">10<\/td>/);
});

test("barChart scales bars from a zero baseline", () => {
  const html = barChart({ title: "t", width: 400, labelWidth: 100, data: [{ label: "a", value: 10 }, { label: "b", value: 5 }] });
  const ends = [...html.matchAll(/class="lx-chart__bar" d="M([\d.]+) [\d.]+ H([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
  const [[x0a, ha], [x0b, hb]] = ends;
  assert.equal(x0a, x0b);
  // The rounded end adds the radius back on; widths are in a 2:1 ratio.
  assert.ok(Math.abs((ha + 4 - x0a) / (hb + 4 - x0b) - 2) < 0.01);
});

test("barChart grows negative bars to the left of zero", () => {
  const html = barChart({ title: "t", data: [{ label: "up", value: 4 }, { label: "down", value: -2 }] });
  const neg = /class="lx-chart__bar lx-chart__bar--negative" d="M([\d.]+) [\d.]+ H([\d.]+)/.exec(html);
  assert.ok(Number(neg[2]) < Number(neg[1]));
  assert.match(html, /text-anchor="end" dominant-baseline="central">-2<\/text>/);
});

test("barChart caps bar thickness and skips zero-length bars", () => {
  const html = barChart({ title: "t", barHeight: 60, data: [{ label: "a", value: 0 }, { label: "b", value: 3 }] });
  assert.equal(html.match(/class="lx-chart__bar"/g).length, 1);
  const d = /class="lx-chart__bar" d="([^"]+)"/.exec(html)[1];
  const top = Number(/^M[\d.]+ ([\d.]+)/.exec(d)[1]);
  const bottom = Number(/([\d.]+) H[\d.]+ Z$/.exec(d)[1]);
  assert.ok(Number(bottom) - Number(top) <= 24);
});

test("barChart shows an empty message for no data and validates input", () => {
  assert.match(barChart({ title: "t", data: [] }), /<p class="lx-chart__empty">No data to show\.<\/p>/);
  assert.throws(() => barChart({ data: [] }), /title is required/);
  assert.throws(() => barChart({ title: "t", data: [{ label: "a", value: "many" }] }), TypeError);
});

test("barChart truncates long labels but keeps the full label in the tooltip and table", () => {
  const long = "A very long category name that will not fit";
  const html = barChart({ title: "t", labelWidth: 70, data: [{ label: long, value: 1 }] });
  assert.match(html, /<title>A very long category name that will not fit: 1<\/title>/);
  assert.match(html, /…<\/text>/);
  assert.match(html, /<th scope="row">A very long category name that will not fit<\/th>/);
});
