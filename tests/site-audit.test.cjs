// Audit strutturale locale, senza pacchetti aggiuntivi. Richiede prima cargo run --release.
const { readFileSync, readdirSync, statSync } = require("node:fs");
const { resolve, dirname, join, relative, sep } = require("node:path");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const root = resolve(__dirname, "../dist");
const origin = readFileSync(resolve(__dirname, "../site.toml"), "utf8").match(/base_url\s*=\s*"([^"]+)"/)[1].replace(/\/$/, "");
const read = (file) => readFileSync(file, "utf8");
const decode = (text) => text.replace(/&#(x[\da-f]+|\d+);/gi, (_, code) => String.fromCodePoint(code[0] === "x" ? parseInt(code.slice(1), 16) : Number(code))).replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const files = (folder) => readdirSync(folder).flatMap((name) => {
  const file = join(folder, name);
  return statSync(file).isDirectory() ? files(file) : [file];
});

function parse(html) {
  const nodes = [], stack = [];
  const voids = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
  let cursor = 0;
  for (const match of html.matchAll(/<!--[\s\S]*?-->|<![^>]+>|<\/?[a-z][^>]*>/gi)) {
    for (const node of stack) node.text += decode(html.slice(cursor, match.index));
    cursor = match.index + match[0].length;
    const token = match[0];
    if (token.startsWith("<!")) continue;
    const tag = token.match(/^<\/?([\w-]+)/)[1].toLowerCase();
    if (token.startsWith("</")) {
      assert.equal(stack.pop()?.tag, tag, `Chiusura HTML non bilanciata: ${token}`);
      continue;
    }
    const attrs = {};
    for (const a of token.slice(tag.length + 1, -1).matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
      assert(!(a[1] in attrs), `Attributo duplicato: ${a[1]}`);
      attrs[a[1]] = decode(a[2] ?? a[3] ?? a[4] ?? "");
    }
    const node = { tag, attrs, text: "", parent: stack.at(-1) };
    nodes.push(node);
    if (!voids.has(tag)) stack.push(node);
  }
  assert.equal(stack.length, 0, "Tag HTML non chiusi");
  return nodes;
}

const pages = new Map(files(root).filter((f) => f.endsWith(".html")).map((f) => [f, parse(read(f))]));
const byTag = (nodes, tag) => nodes.filter((n) => n.tag === tag);
const meta = (nodes, name) => nodes.find((n) => n.tag === "meta" && (n.attrs.name === name || n.attrs.property === name))?.attrs.content;
const link = (nodes, rel) => nodes.filter((n) => n.tag === "link" && n.attrs.rel === rel);

test("HTML: struttura, landmark, titoli, nomi accessibili e riferimenti ARIA", () => {
  assert.equal(pages.size, 5);
  for (const [file, nodes] of pages) {
    assert.equal(byTag(nodes, "main").length, 1, file);
    assert.equal(byTag(nodes, "h1").length, 1, file);
    assert.equal(byTag(nodes, "html").length, 1, file);
    assert(["it", "en"].includes(byTag(nodes, "html")[0].attrs.lang));
    const ids = new Map();
    for (const n of nodes.filter((n) => n.attrs.id)) {
      assert(!ids.has(n.attrs.id), `ID duplicato in ${file}: ${n.attrs.id}`);
      ids.set(n.attrs.id, n);
    }
    let lastHeading = 0;
    for (const n of nodes) {
      if (/^h[1-6]$/.test(n.tag)) {
        const level = Number(n.tag[1]);
        assert(level <= lastHeading + 1, `Salto di livello heading in ${file}`);
        assert(n.text.trim());
        lastHeading = level;
      }
      for (const attr of ["aria-labelledby", "aria-describedby"]) {
        for (const id of (n.attrs[attr] || "").split(/\s+/).filter(Boolean)) assert(ids.has(id), id);
      }
      if (n.tag === "img") {
        assert("alt" in n.attrs, file);
        assert(Number(n.attrs.width) > 0 && Number(n.attrs.height) > 0);
        if (!n.attrs.alt && file !== join(root, "index.html")) assert.equal(n.attrs["aria-hidden"], "true");
      }
      if (n.tag === "a") {
        const image = nodes.find((child) => child.parent === n && child.tag === "img");
        assert(n.attrs["aria-label"] || n.text.trim() || image?.attrs.alt, `Link privo di nome: ${file}`);
      }
      assert(!("tabindex" in n.attrs) || Number(n.attrs.tabindex) <= 0, "tabindex positivo");
      assert(!Object.keys(n.attrs).some((attr) => attr.startsWith("on")), "Handler inline");
      if (n.tag === "address") assert(!nodes.some((child) => child.parent === n && /^h[1-6]$/.test(child.tag)));
    }
    if (file !== join(root, "index.html")) {
      assert.equal(byTag(nodes, "header").length, 1);
      assert.equal(byTag(nodes, "footer").length, 1);
      assert.equal(byTag(nodes, "main")[0].attrs.tabindex, "-1");
      assert.equal(byTag(nodes, "a")[0].attrs.href, "#main");
      assert(byTag(nodes, "nav").every((n) => n.attrs["aria-label"]));
      assert.equal(nodes.filter((n) => n.attrs["aria-current"] === "page").length, 1);
    }
  }
});

test("SEO: metadata distinti, canonical, hreflang reciproci, sitemap e robots", () => {
  const titles = new Set(), descriptions = new Set(), urls = new Set();
  for (const [file, nodes] of pages) {
    const title = byTag(nodes, "title");
    assert.equal(title.length, 1);
    assert(!titles.has(title[0].text)); titles.add(title[0].text);
    const description = meta(nodes, "description");
    assert(description?.length > 30);
    assert(!descriptions.has(description)); descriptions.add(description);
    const canonical = link(nodes, "canonical");
    assert.equal(canonical.length, 1);
    assert(canonical[0].attrs.href.startsWith(origin + "/"));
    assert(!urls.has(canonical[0].attrs.href)); urls.add(canonical[0].attrs.href);
    assert.equal(meta(nodes, "og:url"), canonical[0].attrs.href);
    assert.equal(meta(nodes, "og:title"), title[0].text);
    assert.equal(meta(nodes, "og:description"), description);
    assert.equal(meta(nodes, "twitter:card"), "summary");
    const alternates = link(nodes, "alternate");
    assert.deepEqual(alternates.map((n) => n.attrs.hreflang).sort(), ["en", "it", "x-default"]);
    const policy = file.endsWith("privacy.html");
    for (const n of alternates) {
      const language = n.attrs.hreflang;
      const expected = language === "x-default" ? `${origin}/${policy ? "en/privacy.html" : ""}` : `${origin}/${language}/${policy ? "privacy.html" : ""}`;
      assert.equal(n.attrs.href, expected);
    }
  }
  const sitemapUrls = Array.from(read(join(root, "sitemap.xml")).matchAll(/<loc>(.*?)<\/loc>/g), (m) => decode(m[1]));
  assert.deepEqual(sitemapUrls.sort(), [...urls].sort());
  assert(read(join(root, "robots.txt")).includes(`Sitemap: ${origin}/sitemap.xml`));
});

test("Link, ancore, asset e assenza di risorse esterne o tracking", () => {
  for (const [file, nodes] of pages) {
    for (const n of nodes) {
      assert(!["iframe", "form"].includes(n.tag));
      for (const attr of ["href", "src"]) {
        const ref = n.attrs[attr];
        if (!ref || /^(mailto:|tel:)/.test(ref)) continue;
        if (/^https?:/.test(ref)) {
          assert.equal(n.tag, "link");
          assert(["canonical", "alternate"].includes(n.attrs.rel));
          assert(ref.startsWith(origin + "/"));
          continue;
        }
        const [name, fragment] = ref.split("#");
        const target = name ? resolve(dirname(file), name) : file;
        assert(target.startsWith(root + sep) && statSync(target).isFile(), ref);
        if (fragment) assert(pages.get(target)?.some((n) => n.attrs.id === fragment), ref);
      }
    }
    const scripts = byTag(nodes, "script");
    assert.equal(scripts.length, 1);
    if (file === join(root, "index.html")) {
      assert.equal(scripts[0].attrs.src, undefined);
      assert.equal(scripts[0].parent.tag, "head");
      assert.equal(scripts[0].text.trim(), read(join(root, "assets/language.js")).trim());
    } else {
      assert.equal(scripts[0].attrs.src, "../assets/navigation.js");
    }
  }
  for (const file of files(resolve(__dirname, "../static"))) {
    assert.deepEqual(readFileSync(file), readFileSync(join(root, "assets", relative(resolve(__dirname, "../static"), file))));
  }
});

test("Contrasto WCAG AA dei testi e dei principali indicatori di focus", () => {

  const palette = Object.fromEntries(Array.from(read(join(root, "assets/palette.css")).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g), (m) => [m[1], m[2].trim()]));
  const color = (name) => {
    const value = palette[name];
    assert(value, `Token mancante: ${name}`);
    const variable = value.match(/^var\((--[\w-]+)\)$/);
    return variable ? color(variable[1]) : value;
  };
  const lum = (hex) => {
    const rgb = hex.match(/[\da-f]{2}/gi).map((part) => parseInt(part, 16) / 255).map((c) => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  const contrast = (a, b) => (Math.max(lum(a), lum(b)) + .05) / (Math.min(lum(a), lum(b)) + .05);
  for (const [name, fg, bg] of [
    ["testo su fondo caldo", "--ibis-text", "--ibis-background"],
    ["titoli e link", "--ibis-heading", "--ibis-background"],
    ["testo secondario", "--ibis-text-muted", "--ibis-background"],
    ["testo su verde", "--ibis-text", "--ibis-accent-soft"],
    ["titoli su verde", "--ibis-heading", "--ibis-accent-soft"],
    ["contatti e pulsante", "--ibis-button-text", "--ibis-button-bg"],
  ]) assert(contrast(color(fg), color(bg)) >= 4.5, name);
  for (const bg of ["--ibis-background", "--ibis-accent-soft", "--ibis-white"]) assert(contrast(color("--ibis-focus"), color(bg)) >= 3);
});
