const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { runInNewContext } = require("node:vm");
const { test } = require("node:test");
const assert = require("node:assert/strict");

const script = readFileSync(join(__dirname, "../static/language.js"), "utf8");

function select (languages, language = "", hash = "", codes = ["it", "en"]) {
	let destination;
	const forbidden = () => {
		throw new Error("Persistent storage is forbidden");
	};
	const context = {
		navigator: { languages, language },
		window: {
			location: {
				hash, replace: (href) => {
					destination = href;
				},
			},
		},
		document: {
			querySelectorAll: () => codes.map((code) => ({
				hreflang: code,
				href: `https://example.invalid/subfolder/${code}/index.html`,
			})),
		},
	};
	Object.defineProperty(context.document, "cookie", { get: forbidden, set: forbidden });
	for (const owner of [context, context.window]) {
		Object.defineProperty(owner, "localStorage", { get: forbidden });
		Object.defineProperty(owner, "sessionStorage", { get: forbidden });
	}
	runInNewContext(script, context);
	return destination;
}

test("uses the first supported browser preference, including regional tags", () => {
	assert.equal(select(["fr-FR", "IT-it", "en"]), "https://example.invalid/subfolder/it/index.html");
	assert.equal(select(["en-US", "it-IT"]), "https://example.invalid/subfolder/en/index.html");
});
test("falls back to navigator.language and then English", () => {
	assert.equal(select(undefined, "it-CH"), "https://example.invalid/subfolder/it/index.html");
	assert.equal(select([], "de-DE"), "https://example.invalid/subfolder/en/index.html");
	assert.equal(select([]), "https://example.invalid/subfolder/en/index.html");
});
test("uses generated links when more languages become available", () => {
	assert.equal(select(["fr-CA"], "", "", ["it", "en", "fr"]), "https://example.invalid/subfolder/fr/index.html");
});
test("manual choice bypasses redirection and missing links do not cause a loop", () => {
	assert.equal(select(["it"], "", "#choose"), undefined);
	assert.equal(select(["it"], "", "", []), undefined);
});
