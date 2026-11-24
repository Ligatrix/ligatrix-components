// Package-level checks: public exports match the type declarations, the
// stylesheet defines every token it uses, and the committed gallery is
// current.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as lx from "../src/index.mjs";
import { renderGallery, renderSections } from "../scripts/gallery.mjs";
import { scanTags } from "./helpers.mjs";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("every runtime export is declared in index.d.ts and vice versa", async () => {
  const dts = await read("src/index.d.ts");
  const declared = new Set([...dts.matchAll(/^export (?:function|const) (\w+)/gm)].map((m) => m[1]));
  assert.deepEqual([...declared].sort(), Object.keys(lx).sort());
});

test("the stylesheet defines every custom property it uses, in light and dark", async () => {
  const css = await read("styles/ligatrix-components.css");
  const defined = new Set([...css.matchAll(/(--lx-[\w-]+)\s*:/g)].map((m) => m[1]));
  const used = new Set([...css.matchAll(/var\((--lx-[\w-]+)/g)].map((m) => m[1]));
  for (const name of used) assert.ok(defined.has(name), `${name} is used but never defined`);
  assert.match(css, /@media \(prefers-color-scheme: dark\)/);
  const block = (selector) => css.slice(css.indexOf(selector), css.indexOf("}", css.indexOf(selector)));
  const colours = (text) => [...text.matchAll(/(--lx-color-[\w-]+)\s*:/g)].map((m) => m[1]).sort();
  assert.deepEqual(colours(block(':root:not([data-theme="light"])')), colours(block('[data-theme="dark"] {')));
  assert.deepEqual(colours(block('[data-theme="dark"] {')), colours(block('[data-theme="light"] {')));
});

test("every modifier class the components emit has a rule in the stylesheet", async () => {
  const css = await read("styles/ligatrix-components.css");
  const html = renderSections().join("");
  const classes = new Set([...html.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)).filter((c) => /^lx-.*--/.test(c)));
  assert.ok(classes.size > 20);
  for (const cls of classes) {
    if (cls === "lx-table--comfortable") continue; // the default density needs no rule
    assert.ok(css.includes(`.${cls}`), `.${cls} has no style rule`);
  }
});

test("gallery/index.html is current with the source", async () => {
  assert.equal(await read("gallery/index.html"), await renderGallery(), "Run: npm run gallery");
});

test("the gallery is well-formed and has one section per component", async () => {
  const html = await renderGallery();
  scanTags(html.replace(/^<!DOCTYPE html>\n/, "").replace(/<style>[\s\S]*?<\/style>|<script>[\s\S]*?<\/script>/g, ""));
  assert.equal(renderSections().length, 13);
  assert.equal(new Set([...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1])).size, [...html.matchAll(/ id="([^"]+)"/g)].length, "duplicate ids");
});
