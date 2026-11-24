import { test } from "node:test";
import assert from "node:assert/strict";
import { button, badge, alert, card, emptyState, pagination, pageRange, resetIds } from "../src/index.mjs";

test("button renders a typed button with variant and size classes", () => {
  const html = button({ label: "Save", variant: "secondary", size: "sm" });
  assert.match(html, /^<button class="lx-button lx-button--secondary lx-button--sm" type="button">/);
  assert.match(html, />Save<\/span><\/button>$/);
});

test("button with href renders a link and filters unsafe URLs", () => {
  assert.match(button({ label: "Go", href: "/orders" }), /^<a [^>]*href="\/orders"/);
  assert.match(button({ label: "Go", href: "javascript:alert(1)" }), /href="#"/);
});

test("a disabled link button loses its href and is marked aria-disabled", () => {
  const html = button({ label: "Go", href: "/x", disabled: true });
  assert.doesNotMatch(html, /href=/);
  assert.match(html, /aria-disabled="true"/);
});

test("a loading button is disabled, busy and shows a hidden spinner", () => {
  const html = button({ label: "Saving", loading: true });
  assert.match(html, / disabled/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /class="lx-spinner" aria-hidden="true"/);
});

test("button validates its options", () => {
  assert.throws(() => button({}), /label is required/);
  assert.throws(() => button({ label: "x", variant: "loud" }), RangeError);
  assert.throws(() => button({ label: "x", type: "link" }), RangeError);
});

test("button merges extra attributes and classes without losing its own", () => {
  const html = button({ label: "x", className: "mine", attrs: { class: "extra", "data-id": "7", type: "submit" } });
  assert.match(html, /class="lx-button lx-button--primary lx-button--md mine extra"/);
  assert.match(html, /data-id="7"/);
  assert.match(html, /type="submit"/);
});

test("badge renders each status and rejects unknown ones", () => {
  for (const status of ["neutral", "info", "success", "warning", "danger"]) {
    assert.match(badge({ label: "x", status }), new RegExp(`lx-badge--${status}`));
  }
  assert.throws(() => badge({ label: "x", status: "purple" }), RangeError);
  assert.doesNotMatch(badge({ label: "x", dot: false }), /lx-badge__dot/);
});

test("alert uses role=alert for warning and danger, role=status otherwise", () => {
  assert.match(alert({ tone: "danger", message: "x" }), /role="alert"/);
  assert.match(alert({ tone: "warning", message: "x" }), /role="alert"/);
  assert.match(alert({ tone: "info", message: "x" }), /role="status"/);
  assert.match(alert({ tone: "success", message: "x" }), /role="status"/);
});

test("a dismissible alert has a labelled close button", () => {
  assert.match(alert({ message: "x", dismissible: true }), /<button type="button" class="lx-alert__dismiss" aria-label="Dismiss">/);
  assert.doesNotMatch(alert({ message: "x" }), /<button/);
});

test("card labels its section with its heading and honours headingLevel", () => {
  resetIds();
  const html = card({ title: "Orders", headingLevel: 3, body: "Text" });
  assert.match(html, /<section class="lx-card" id="lx-card-1" aria-labelledby="lx-card-1-title">/);
  assert.match(html, /<h3 class="lx-card__title" id="lx-card-1-title">Orders<\/h3>/);
  assert.throws(() => card({ title: "x", headingLevel: 7 }), RangeError);
});

test("card escapes body but passes bodyHtml through", () => {
  assert.match(card({ body: "<b>x</b>" }), /&lt;b&gt;x&lt;\/b&gt;/);
  assert.match(card({ bodyHtml: "<b>x</b>" }), /<b>x<\/b>/);
});

test("card without a title has no aria-labelledby", () => {
  assert.doesNotMatch(card({ body: "x" }), /aria-labelledby/);
});

test("emptyState renders a heading, message and action", () => {
  const html = emptyState({ title: "No invoices", message: "None yet.", actionHtml: "<a href='#'>Add</a>" });
  assert.match(html, /<h3 class="lx-empty__title">No invoices<\/h3>/);
  assert.match(html, /None yet\./);
  assert.match(html, /<div class="lx-empty__action"><a href='#'>Add<\/a><\/div>/);
});

test("pageRange keeps first, last and neighbours, with gaps as null", () => {
  assert.deepEqual(pageRange(6, 12), [1, null, 5, 6, 7, null, 12]);
  assert.deepEqual(pageRange(1, 3), [1, 2, 3]);
  assert.deepEqual(pageRange(3, 7), [1, 2, 3, 4, null, 7]);
  assert.deepEqual(pageRange(1, 0), []);
});

test("pageRange fills a one-page gap instead of showing an ellipsis", () => {
  assert.deepEqual(pageRange(4, 10), [1, 2, 3, 4, 5, null, 10]);
});

test("pageRange clamps an out-of-range page", () => {
  assert.deepEqual(pageRange(99, 5), [1, null, 4, 5]);
  assert.deepEqual(pageRange(-3, 5), [1, 2, null, 5]);
});

test("pagination marks the current page and disables Previous on page one", () => {
  const html = pagination({ page: 1, pageCount: 3 });
  assert.match(html, /<nav class="lx-pagination" aria-label="Pagination">/);
  assert.match(html, /aria-current="page" href="\?page=1"/);
  assert.match(html, /<span class="lx-pagination__link lx-pagination__step" aria-disabled="true">.*Previous<\/span>/);
  assert.match(html, /href="\?page=2" rel="next"/);
});

test("pagination disables Next on the last page", () => {
  const html = pagination({ page: 5, pageCount: 5 });
  assert.match(html, /aria-disabled="true">Next/);
  assert.match(html, /href="\?page=4" rel="prev"/);
});

test("pagination renders nothing for a single page or none", () => {
  assert.equal(pagination({ page: 1, pageCount: 1 }), "");
  assert.equal(pagination({ page: 1, pageCount: 0 }), "");
});

test("pagination accepts an href function and filters unsafe results", () => {
  assert.match(pagination({ page: 1, pageCount: 2, href: (p) => `/orders/p/${p}` }), /href="\/orders\/p\/2"/);
  assert.doesNotMatch(pagination({ page: 1, pageCount: 2, href: "javascript:go({page})" }), /javascript/);
});
