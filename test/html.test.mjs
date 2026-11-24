import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, attrs, safeUrl, cx, uid, resetIds } from "../src/index.mjs";

test("escapeHtml escapes every character that can break out of text or an attribute", () => {
  assert.equal(escapeHtml(`<a href="x" title='y'>&\`</a>`), "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&#96;&lt;/a&gt;");
});

test("escapeHtml turns null and undefined into empty strings and stringifies the rest", () => {
  assert.equal(escapeHtml(null), "");
  assert.equal(escapeHtml(undefined), "");
  assert.equal(escapeHtml(0), "0");
  assert.equal(escapeHtml(false), "false");
});

test("escapeHtml does not double-decode existing entities", () => {
  assert.equal(escapeHtml("&lt;"), "&amp;lt;");
});

test("attrs renders booleans bare, skips false/null/undefined and escapes values", () => {
  assert.equal(attrs({ disabled: true, hidden: false, title: null, id: undefined, "data-x": 'a"b' }), ' disabled data-x="a&quot;b"');
});

test("attrs skips an empty class but keeps other empty strings", () => {
  assert.equal(attrs({ class: "", alt: "" }), ' alt=""');
});

test("attrs refuses invalid attribute names", () => {
  assert.throws(() => attrs({ 'x" onclick="y': "1" }), TypeError);
  assert.throws(() => attrs({ "a b": "1" }), TypeError);
});

test("attrs refuses inline event handlers in any case", () => {
  assert.throws(() => attrs({ onclick: "x()" }), /Event handler/);
  assert.throws(() => attrs({ OnMouseOver: "x()" }), /Event handler/);
});

test("attrs filters dangerous URLs in href and src", () => {
  assert.equal(attrs({ href: "javascript:alert(1)" }), ' href="#"');
  assert.equal(attrs({ src: "data:text/html,<script>" }), ' src="#"');
  assert.equal(attrs({ href: "/orders?id=1&x=2" }), ' href="/orders?id=1&amp;x=2"');
});

test("safeUrl allows relative, http(s), mailto and tel URLs", () => {
  for (const url of ["/a", "./b", "../c", "?page=2", "#top", "orders/12", "https://example.com", "http://x.test", "mailto:a@b.test", "tel:+15550100"]) {
    assert.equal(safeUrl(url), url, url);
  }
});

test("safeUrl blocks script-capable schemes, including obfuscated ones", () => {
  for (const url of ["javascript:x", "JaVaScRiPt:x", " javascript:x", "java\tscript:x", "java\nscript:x", "vbscript:x", "data:text/html,x", "", null, undefined]) {
    assert.equal(safeUrl(url), "#", String(url));
  }
});

test("cx joins truthy class names, flattening arrays", () => {
  assert.equal(cx("a", false, null, ["b", "", "c"], undefined), "a b c");
});

test("uid is deterministic after resetIds", () => {
  resetIds();
  const first = [uid("x"), uid("x")];
  resetIds();
  assert.deepEqual([uid("x"), uid("x")], first);
  assert.notEqual(first[0], first[1]);
});
