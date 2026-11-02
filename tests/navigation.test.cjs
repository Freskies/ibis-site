const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { runInNewContext } = require("node:vm");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const script = readFileSync(join(__dirname, "../static/navigation.js"), "utf8");

function navigate(href, options = {}) {
  let handler, blur, prevented = false, focused = false, scrolled = false;
  const attributes = new Map(options.focusable ? [["tabindex", "-1"]] : []);
  const forbidden = () => { throw new Error("URL, cronologia e storage non devono cambiare"); };
  const target = {
    hasAttribute: (name) => attributes.has(name),
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: (name) => attributes.delete(name),
    addEventListener: (name, callback) => { assert.equal(name, "blur"); blur = callback; },
    focus: (settings) => { assert.equal(settings.preventScroll, true); focused = true; },
    scrollIntoView: (settings) => { assert.equal(settings.block, "start"); scrolled = true; },
  };
  const location = new URL(options.current || "https://www.ibissrl.biz/it/");
  const window = {};
  Object.defineProperty(window, "location", { get: () => location, set: forbidden });
  for (const key of ["history", "localStorage", "sessionStorage"]) Object.defineProperty(window, key, { get: forbidden });
  const link = { href, target: options.target || "", hasAttribute: () => !!options.download };
  const document = {
    addEventListener: (name, callback) => { assert.equal(name, "click"); handler = callback; },
    getElementById: (id) => id === "prodotti" && !options.missing ? target : null,
  };
  Object.defineProperty(document, "cookie", { get: forbidden, set: forbidden });
  runInNewContext(script, { document, window, URL });
  handler({ button: 0, target: { closest: () => link }, preventDefault: () => { prevented = true; }, ...options.event });
  return { prevented, focused, scrolled, attributes, blur, location };
}

test("ancore della home: scorrimento e focus senza modificare l’URL", () => {
  for (const href of ["#prodotti", "index.html#prodotti", "https://www.ibissrl.biz/it/#prodotti"]) {
    const result = navigate(href);
    assert(result.prevented && result.focused && result.scrolled);
    assert.equal(result.location.href, "https://www.ibissrl.biz/it/");
    assert.equal(result.attributes.get("tabindex"), "-1");
    result.blur();
    assert(!result.attributes.has("tabindex"));
  }
});
test("funziona anche con index.html locale e conserva tabindex già presenti", () => {
  const result = navigate("index.html#prodotti", { current: "file:///C:/site/dist/it/index.html", focusable: true });
  assert(result.prevented && result.focused && result.scrolled);
  assert.equal(result.blur, undefined);
  assert.equal(result.attributes.get("tabindex"), "-1");
});
test("lingue, privacy, altre pagine e ancore mancanti mantengono la navigazione nativa", () => {
  for (const href of ["../en/index.html", "privacy.html", "https://example.org/#prodotti", "#assente", "?test=1#prodotti"]) {
    const result = navigate(href);
    assert(!result.prevented && !result.focused && !result.scrolled);
  }
});
test("rispetta nuove schede, download, modificatori e click non primari", () => {
  for (const options of [{ target: "_blank" }, { download: true }, { event: { ctrlKey: true } }, { event: { metaKey: true } }, { event: { shiftKey: true } }, { event: { altKey: true } }, { event: { button: 1 } }, { event: { defaultPrevented: true } }]) {
    assert(!navigate("#prodotti", options).prevented);
  }
});
