# IBIS

Rust genera il sito con Askama e traduzioni TOML. In produzione Caddy serve
solo dist/: nessun backend, framework JavaScript, cookie, tracker, font remoto
o servizio esterno. Un piccolo script locale sceglie la lingua all’ingresso.

## Generazione e anteprima

Servono Rust/Cargo con supporto all’edizione 2024.

    cargo fmt
    cargo check
    cargo run --release

Apri dist/index.html nel browser. La lingua viene scelta automaticamente;
dist/index.html#choose mantiene la scelta manuale. I link relativi funzionano
anche da file locali. In alternativa, se Python è già installato:

    python -m http.server 8000 --directory dist --bind 127.0.0.1

Visita http://127.0.0.1:8000/ e interrompi con Ctrl+C.
Il server di anteprima non fa parte dell’applicazione.

Output:

    dist/index.html
    dist/it/index.html
    dist/en/index.html
    dist/it/privacy.html
    dist/en/privacy.html
    dist/assets/
    dist/sitemap.xml
    dist/robots.txt

Il generatore sovrascrive i propri file ma non elimina output obsoleto.
Se rimuovi lingue o asset, elimina i relativi file da dist prima di pubblicare.

## Organizzazione

- src/main.rs: configurazione, validazione, rendering e copia ricorsiva degli asset.
- site.toml: dominio canonico. Ora https://www.ibissrl.biz, confermato per il progetto.
- templates/base.html: struttura comune, navigazione, salto al contenuto e footer.
- templates/home.html e policy.html: contenuti delle pagine.
- templates/languages.html: ingresso e scelta lingua.
- templates/metadata.html: metadata SEO e condivisione comuni.
- templates/sitemap.xml: sitemap generata dall’elenco delle lingue.
- locales/it.toml ed en.toml: testi, etichette accessibili e metadata traducibili.
- static/: esclusivamente risorse usate nel sito.
- reference/: originali non modificati, mai copiati nel sito.
- tests/: verifiche locali, senza dipendenze Node aggiuntive.
- tmp/: materiale temporaneo escluso da Git e dall’output.

I TOML devono avere gli stessi campi. Chiavi mancanti o sconosciute, tipi errati,
stringhe vuote e liste vuote anche annidate causano errori con file e campo.
La validazione e il rendering avvengono prima di scrivere gli HTML.
Askama esegue l’escaping: i TOML contengono testo, non HTML.

Per aggiungere lingue, estendi LANGUAGES in src/main.rs e crea il relativo TOML.
Selettori, hreflang e sitemap derivano dall’elenco. Le altre due lingue
previste restano da scegliere. La traduzione inglese è da validare dal cliente.

## Lingua automatica senza cookie

Solo la pagina di ingresso carica static/language.js.
navigator.languages è letto nell’ordine di preferenza, con navigator.language
come riserva. Si usa la prima lingua disponibile fra i link generati.
it-CH diventa it; en-US diventa en. Se non c’è corrispondenza si usa l’inglese.
Le pagine linguistiche e le informative non reindirizzano, così i link diretti
e la scelta manuale sono rispettati. Senza JavaScript resta la scelta manuale.

Nessun cookie, localStorage, sessionStorage, geolocalizzazione o memorizzazione
della preferenza. Solo normali richieste delle pagine al server.

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

Se cambia il dominio, modifica base_url in site.toml e rigenera.
Sono ammessi origini HTTPS senza percorsi. I canonical delle home linguistiche
sono /it/ ed /en/; quelli privacy sono /it/privacy.html ed /en/privacy.html.
I link locali restano relativi per permettere l’anteprima.

Le anteprime non devono essere pubblicate su un dominio di staging indicizzabile
con i canonical di produzione: proteggere lo staging prima di renderlo accessibile.
Non è stata cambiata alcuna configurazione del server.

Riferimenti:

- https://developers.google.com/search/docs/specialty/international/localized-versions
- https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

## Verifiche ripetibili

Dopo la generazione, con Node già disponibile:

    node --test tests/*.test.cjs

Gli otto test coprono selezione della lingua e assenza di storage; struttura HTML,
titoli e landmark; nomi accessibili, ID e riferimenti ARIA; metadata distinti,
canonical, hreflang, sitemap e robots; link, ancore e copia degli asset;
contrasto AA delle coppie di colori principali.

L’audit strutturale usa un parser limitato ai template statici del progetto:
non è un validatore HTML normativo, un audit axe/Lighthouse o una certificazione
WCAG. I test non possono garantire da soli l’esperienza con screen reader.
Le dimensioni reali dei target, reflow e focus vanno verificati anche nel browser.

## Identità e contenuti

Materiali letti da reference/brief.md, LEGGIMI.txt, guide palette e proposta PDF.
Il brief cita reference/brand, ma i materiali sono in Loghi, Palette e Web-favicon.
Originali selezionati e copiati senza alterazioni:

| Asset in static         | Originale in reference                               | Uso                    |
|-------------------------|------------------------------------------------------|------------------------|
| logo-horizontal.svg     | Loghi/02-Orizzontale/SVG/IBIS-orizzontale-colore.svg | Header e scelta lingua |
| logo-vertical-white.svg | Loghi/03-Verticale/SVG/IBIS-verticale-bianco.svg     | Hero su fondo blu      |
| logo-mini.svg           | Loghi/04-Simbolo-minimo/SVG/IBIS-minimo-colore.svg   | Bullet attività        |
| favicon.svg             | Web-favicon/favicon.svg                              | Icona browser          |
| apple-touch-icon.png    | Web-favicon/apple-touch-icon.png                     | Icona Apple            |
| palette.css             | Palette/IBIS-palette.css                             | Colori originali       |

Nessuna guida, presentazione o variante non usata entra in dist.
Nessuna fotografia è stata aggiunta. Font di sistema e Georgia.

Fonti dei dati aziendali:

- https://www.ibissrl.biz/contatti: indirizzo operativo, nomi, email e telefoni.
- https://www.ibissrl.biz/servizi-prodotti: conferma dei prodotti già nel brief.
- https://www.ufficiocamerale.it/6499/ibis-srl: P.IVA/C.F. 01286410392,
  REA RA-133634 e capitale €30.000,00; fonte commerciale, da verificare con visura.
- https://www.to.camcom.it/book/export/html/8770: riferimenti ai dati societari.
- https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876:
  riferimento su cookie e strumenti di tracciamento.

## Cosa resta prima della pubblicazione

1. Verificare con il cliente sede legale, Registro Imprese, capitale effettivamente
   versato, eventuale socio unico/liquidazione e gli altri dati societari.
2. Completare l’informativa: gestore e ubicazione del server, fornitori e log,
   basi giuridiche e conservazione. Caddy non è stato ispezionato:
   https://caddyserver.com/docs/caddyfile/directives/log
3. Confermare i materiali del rebranding: i file di consegna riportano ancora
   un’approvazione finale pendente. Gli avvisi redazionali sono stati rimossi
   dalle pagine su richiesta, senza inventare i dati mancanti.
4. Provare con NVDA su Windows, VoiceOver/Safari su iPhone e un telefono Android
   reale; verificare anche ingrandimento testo e zoom al 200–400%.
5. Preparare in Caddy redirect permanenti dalle vecchie pagine
   /contatti, /servizi-prodotti e /descrizione-attivita verso le nuove sezioni.
   Verificare dominio www/non-www, HTTPS, risposta 404 corretta, compressione,
   cache e intestazioni di sicurezza.
6. Dopo il deploy autorizzato, verificare HTTP/redirect, inviare la sitemap
   in Search Console e controllare l’indicizzazione. Un’immagine social
   dedicata è un miglioramento facoltativo, non ancora presente.

Il sito è senza tracciamento, ma ciò non esclude dati di connessione o log
del server. Nessun deploy o modifica a Caddy è stato eseguito.

## Esito audit del 2 novembre 2026

- cargo fmt, cargo check, cargo run --release e gli otto test locali: superati.
- Lighthouse 13.5, emulazione mobile su anteprima HTTP locale:
	- Home italiana: prestazioni 100, accessibilità 100, buone pratiche 100, SEO 100.
	- Privacy inglese: prestazioni 99, accessibilità 100, buone pratiche 100, SEO 100.
- Verificati nel browser: resa desktop, emulazione mobile a 427 e 320 CSS px,
  focus visibile sul salto al contenuto, passaggio al primo link del main,
  raggiungibilità dei recapiti senza che il focus venga coperto dall’header.
- L’albero accessibile di Chrome espone navigazioni, sezioni, titoli e liste,
  con i marchi decorativi esclusi. Nessun test vocale NVDA/VoiceOver è stato eseguito.

I risultati Lighthouse valgono per le due pagine e la singola esecuzione locale,
non per l’hosting di produzione. Non sono una certificazione WCAG né una
garanzia di indicizzazione o posizionamento. Gli altri HTML sono coperti
dall’audit strutturale condiviso e usano gli stessi template e stili.

Provato anche lo zoom del browser al 400% sulla privacy inglese:
il layout mantiene il contenuto raggiungibile e l’header non resta fisso
sopra il testo. Lo zoom è stato poi riportato al valore normale.
Il rettangolo azzurro da tocco è gestito tramite CSS WebKit; il comportamento
su Safari/iOS reale resta da verificare sul dispositivo, distinto dal focus
da tastiera che deve continuare a essere visibile.

## Navigazione interna senza cronologia

static/navigation.js intercetta i normali click sulle ancore della stessa pagina,
compresi navbar, logo, pulsanti hero e salto al contenuto. Sposta focus e vista
senza modificare URL o aggiungere voci alla cronologia; non usa storage o cookie.
Il tasto Indietro non ripercorre quindi gli spostamenti fra sezioni.

I collegamenti restano link HTML per SEO, accessibilità e funzionamento senza
JavaScript; in quel caso si applica il normale comportamento delle ancore.
Link ad altre pagine (privacy, altre lingue), nuove schede e click con
modificatori mantengono il comportamento nativo del browser.
Il movimento ridotto continua a dipendere dalla preferenza CSS dell’utente.

Il layout comune ora carica questo secondo piccolo script locale, mentre
lo script di scelta lingua resta riservato all’ingresso.
Verifiche aggiornate: cargo fmt, cargo check, cargo run --release e 12 test
automatici superati, inclusi focus, URL invariato e rispetto dei link normali.
