import { test } from "node:test";
import assert from "node:assert/strict";
import { formField, select, resetIds } from "../src/index.mjs";

test("formField links its label to the input", () => {
  const html = formField({ label: "Reference", name: "ref", id: "ref" });
  assert.match(html, /<label class="lx-field__label" for="ref">Reference<\/label>/);
  assert.match(html, /<input class="lx-input" id="ref" name="ref" type="text">/);
});

test("formField wires hint and error with aria-describedby and aria-invalid", () => {
  const html = formField({ label: "Email", id: "em", type: "email", hint: "Work address", error: "Enter a full address" });
  assert.match(html, /aria-invalid="true" aria-describedby="em-hint em-error"/);
  assert.match(html, /<p class="lx-field__hint" id="em-hint">Work address<\/p>/);
  assert.match(html, /<p class="lx-field__error" id="em-error">/);
  assert.match(html, /class="lx-field lx-field--invalid"/);
});

test("formField marks required fields in text and with the required attribute", () => {
  const html = formField({ label: "Qty", id: "q", required: true });
  assert.match(html, /<span class="lx-field__required" aria-hidden="true">\*<\/span><span class="lx-sr-only"> \(required\)<\/span>/);
  assert.match(html, / required/);
});

test("formField renders a textarea with its value as escaped content", () => {
  const html = formField({ label: "Notes", id: "n", type: "textarea", value: "</textarea><b>", rows: 5 });
  assert.match(html, /<textarea class="lx-input" id="n" rows="5">&lt;\/textarea&gt;&lt;b&gt;<\/textarea>/);
});

test("formField generates an id when none is given and rejects unknown types", () => {
  resetIds();
  assert.match(formField({ label: "A" }), /for="lx-field-1"/);
  assert.throws(() => formField({ label: "A", type: "colour" }), RangeError);
  assert.throws(() => formField({ name: "a" }), /label is required/);
});

test("formField passes extra input attributes and keeps the zero value", () => {
  const html = formField({ label: "Qty", id: "q", type: "number", value: 0, inputAttrs: { min: "0", step: "1" } });
  assert.match(html, /value="0" min="0" step="1"/);
});

test("select marks the chosen option and supports groups and disabled options", () => {
  const html = select({
    label: "Approver",
    id: "ap",
    value: "dana",
    options: ["none", { label: "Purchasing", options: [{ value: "dana", label: "Dana" }, { value: "sam", label: "Sam", disabled: true }] }],
  });
  assert.match(html, /<option value="none">none<\/option>/);
  assert.match(html, /<optgroup label="Purchasing"><option value="dana" selected>Dana<\/option><option value="sam" disabled>Sam<\/option><\/optgroup>/);
});

test("select renders a placeholder that is selected only when nothing else is", () => {
  assert.match(select({ label: "D", id: "d", placeholder: "Choose", options: ["a"] }), /<option value="" selected>Choose<\/option>/);
  assert.match(select({ label: "D", id: "d", placeholder: "Choose", options: ["a"], value: "a" }), /<option value="">Choose<\/option>/);
  assert.match(select({ label: "D", id: "d", placeholder: "Choose", options: ["a"], required: true }), /<option value="" selected disabled>/);
});

test("select supports multiple values and numeric option values", () => {
  const html = select({ label: "M", id: "m", multiple: true, value: ["1", 3], options: [{ value: 1, label: "One" }, { value: 2, label: "Two" }, { value: 3, label: "Three" }] });
  assert.match(html, / multiple/);
  assert.match(html, /<option value="1" selected>One<\/option><option value="2">Two<\/option><option value="3" selected>Three<\/option>/);
});

test("select wires its error and rejects non-array options", () => {
  assert.match(select({ label: "C", id: "c", options: [], error: "Pick one" }), /aria-invalid="true" aria-describedby="c-error"/);
  assert.throws(() => select({ label: "C", options: "a,b" }), TypeError);
});
