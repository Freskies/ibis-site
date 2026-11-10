# Progetto IBIS

Sito vetrina di IBIS, azienda che si occupa di export management
nel settore ortofrutticolo.

## Architettura

- Rust è utilizzato solo come generatore di file statici.
- Usa Askama per i template HTML.
- Usa file TOML separati per i testi di ogni lingua.
- Il comando `cargo run --release` deve generare il sito in `dist/`.
- Il sito pubblicato contiene soltanto HTML, CSS, immagini
  ed eventualmente poco JavaScript.
- Caddy servirà il contenuto di `dist/`.
- Non introdurre backend HTTP, database, framework JavaScript
  o strumenti di build aggiuntivi senza una necessità concreta.

## Contenuti e lingue

- Il sito sarà disponibile in almeno quattro lingue,
  ancora da confermare.
- Parti con italiano e inglese per verificare il funzionamento.
- Genera una pagina per lingua: /it/, /en/, ecc.
- Usa normali link per il selettore delle lingue.
- Tutti i testi traducibili devono stare nei file TOML.
- Non inventare informazioni sull'azienda:
  usa segnaposto chiaramente riconoscibili quando mancano i testi.
- Non creare un CMS o un pannello di amministrazione.

## Interfaccia

- Sito semplice, accessibile e responsive.
- Le informazioni devono essere facili da trovare,
  anche per chi arriva dal QR stampato sui pacchi.
- Usa collegamenti mailto e tel per i contatti.
- Riutilizza i loghi e la palette forniti, senza ridisegnarli.
- Non aggiungere tracker o servizi esterni non richiesti.

## Modalità di lavoro

- Mantieni il codice semplice e le dipendenze limitate.
- Documenta nel README come generare e vedere il sito in locale.
- Verifica compilazione e generazione dopo le modifiche.
- Non pubblicare sul server senza una richiesta esplicita.

## Semantica, accessibilità e mobile

- HTML con header, nav distinte per funzione, main, footer, sezioni con titoli,
  gerarchia h1/h2/h3, liste di attività/contatti e descrizioni dei prodotti in dl.
- Indirizzi marcati con address; Organization nel footer mediante microdata,
  senza JavaScript o richieste esterne.
- Un h1 per pagina, lang corretto e cambio di lingua marcato sui link.
- Immagini informative con alt; marchi ripetuti e bullet decorativi esclusi
  dall’albero accessibile. Dimensioni esplicite per limitare spostamenti del layout.
- Controlli nativi raggiungibili con Tab e attivabili con Invio, nessun tabindex
  positivo e nessuna interazione riservata al mouse.
- Salto al contenuto con destinazione focusabile; focus visibile, incluso quello
  sui contatti a fondo scuro. Margine di scorrimento per evitare l’header sticky.
- Target principali di almeno 44 px in altezza; link ai contatti possono andare
  a capo su schermi stretti. Nessun blocco di selezione del testo o zoom.
- Evidenziazione azzurra WebKit al tocco rimossa solo dai link, con feedback
  active alternativo. Il focus da tastiera non è disabilitato.
- Supporto a prefers-reduced-motion e forced-colors.
- Grid/flex adattivi, parole lunghe spezzabili e header non fisso su viewport
  bassi (zoom elevato o telefono orizzontale), per non coprire il contenuto.

## SEO

Titoli e descrizioni distinti, canonical assoluti, hreflang reciproci e x-default,
Open Graph, Twitter Card testuale, sitemap e robots sono generati localmente.
La privacy ha metadata dedicati. Nessuna promessa di posizionamento o rich result.

Il sito è raggiungibile sia da ibissrl.biz sia da lovefruit.it, anche con www.
Entrambi servono gli stessi file; i metadata usano un'unica origine canonica,
https://www.ibissrl.biz, mantenendo la configurazione esistente.
Se cambia il dominio canonico, modifica base_url in site.toml e rigenera.
Sono ammessi origini HTTPS senza percorsi. I canonical delle home linguistiche
sono /it/, /en/, /fr/, /pt/ ed /es/; quelli privacy aggiungono privacy.html
al percorso della rispettiva lingua.
I link locali restano relativi per permettere l’anteprima.

Le anteprime non devono essere pubblicate su un dominio di staging indicizzabile
con i canonical di produzione: proteggere lo staging prima di renderlo accessibile.
Non è stata cambiata alcuna configurazione del server.

Il Caddyfile incluso è un esempio da installare solo al deploy autorizzato:
adatta /srv/ibis-site/dist al percorso assoluto effettivo sul server e configura
i record DNS dei quattro host verso quel server. Caddy servirà gli stessi file
su tutti gli host, senza reindirizzamenti fra i domini. Prima del caricamento,
verifica la configurazione con `caddy validate --config Caddyfile`.

Riferimenti:

- https://developers.google.com/search/docs/specialty/international/localized-versions
- https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html