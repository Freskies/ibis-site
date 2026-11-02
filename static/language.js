// Solo sulla pagina di ingresso: nessun cookie, storage o richiesta esterna.
(() => {
	if (window.location.hash === "#choose") return;

	const links = Array.from(document.querySelectorAll(".choice-links a[hreflang]"));
	const preferences = navigator.languages?.length
		? navigator.languages
		: [navigator.language || ""];

	for (const preference of preferences) {
		const language = preference.toLowerCase().split("-")[0];
		const link = links.find((item) => item.hreflang === language);
		if (link) {
			window.location.replace(link.href);
			return;
		}
	}

	// Inglese per i visitatori senza una lingua supportata; nessun elenco duplicato.
	const fallback = links.find((item) => item.hreflang === "en") || links[0];
	if (fallback) window.location.replace(fallback.href);
})();
