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