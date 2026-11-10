// La tendina conserva apertura e semantica native anche senza JavaScript.
const languagePicker = document.querySelector(".language-picker");
if (languagePicker) {
	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape" && languagePicker.open) {
			languagePicker.open = false;
			languagePicker.querySelector("summary").focus();
			event.preventDefault();
		}
	});
	document.addEventListener("click", (event) => {
		if (!languagePicker.contains(event.target)) languagePicker.open = false;
	});
	languagePicker.addEventListener("focusout", (event) => {
		if (event.relatedTarget && !languagePicker.contains(event.relatedTarget)) languagePicker.open = false;
	});
}

// Le ancore nella stessa pagina spostano focus e vista, senza cambiare URL o cronologia.
document.addEventListener("click", (event) => {
	if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
	const link = event.target.closest?.("a[href]");
	if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;

	const destination = new URL(link.href, window.location.href);
	const current = new URL(window.location.href);
	const pagePath = (pathname) => pathname.replace(/\/index\.html$/, "/");
	if (destination.origin !== current.origin || pagePath(destination.pathname) !== pagePath(current.pathname) || destination.search !== current.search || !destination.hash) return;

	let id;
	try {
		id = decodeURIComponent(destination.hash.slice(1));
	} catch {
		return;
	}
	const target = document.getElementById(id);
	if (!target) return;

	event.preventDefault();
	// Le sezioni diventano focusabili senza aggiungerle all'ordine di tabulazione.
	if (!target.hasAttribute("tabindex")) {
		target.setAttribute("tabindex", "-1");
		target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
	}
	target.focus({ preventScroll: true });
	// Il comportamento fluido e la preferenza di movimento ridotto sono gestiti dal CSS.
	target.scrollIntoView({ block: "start" });
});
