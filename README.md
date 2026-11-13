# IBIS

Rust genera il sito con Askama e traduzioni TOML. In produzione Caddy serve
solo dist/: nessun backend, framework JavaScript, cookie, tracker, font remoto
o servizio esterno. Un piccolo script locale sceglie la lingua all’ingresso.

## Generazione e anteprima


    cargo fmt
    cargo check
    cargo run --release

Apri dist/index.html nel browser. La lingua viene scelta automaticamente;
dist/index.html#choose mantiene la scelta manuale. Il redirect è incorporato
nella testa dell’HTML e parte prima del contenuto, senza attendere script esterni.
I link restano disponibili se JavaScript è disattivato; titolo e metadati
dell’ingresso descrivono l’azienda anche nelle anteprime dei link.

    python -m http.server 8000 --directory dist --bind 127.0.0.1

Visita http://127.0.0.1:8000/

Output:

    dist/index.html
    dist/it/index.html
    dist/en/index.html
    dist/fr/index.html
    dist/pt/index.html
    dist/es/index.html
    dist/it/privacy.html
    dist/en/privacy.html
    dist/fr/privacy.html
    dist/pt/privacy.html
    dist/es/privacy.html
    dist/assets/
    dist/sitemap.xml
    dist/robots.txt

Il generatore sovrascrive i propri file ma non elimina output obsoleto.
Se rimuovi lingue o asset, elimina i relativi file da dist prima di pubblicare.

## Organizzazione

- src/main.rs: configurazione, validazione, rendering e copia ricorsiva degli asset.
- site.toml: origine canonica https://www.ibissrl.biz, condivisa dai due domini.
- Caddyfile: esempio per servire dist da ibissrl.biz e lovefruit.it, anche con www.
- templates/base.html: struttura comune, navigazione, salto al contenuto e footer.
- templates/home.html e policy.html: contenuti delle pagine.
- templates/languages.html: ingresso e scelta lingua.
- templates/metadata.html: metadata SEO e condivisione comuni.
- templates/sitemap.xml: sitemap generata dall’elenco delle lingue.
- locales/{it,en,fr,pt,es}.toml: testi, etichette accessibili e metadata traducibili.
- static/: esclusivamente risorse usate nel sito.
- reference/: originali non modificati, mai copiati nel sito.
- tests/: verifiche locali, senza dipendenze Node aggiuntive.
- tmp/: materiale temporaneo escluso da Git e dall’output.

I TOML devono avere gli stessi campi. Chiavi mancanti o sconosciute, tipi errati,
stringhe vuote e liste vuote anche annidate causano errori con file e campo.
La validazione e il rendering avvengono prima di scrivere gli HTML.
Askama esegue l’escaping: i TOML contengono testo, non HTML.

Per aggiungere lingue, estendi LANGUAGES in src/main.rs e crea il relativo TOML.
Selettori, hreflang e sitemap derivano dall’elenco. Sono disponibili italiano,
inglese, francese, portoghese e spagnolo. Le traduzioni sono da validare dal cliente;
il portoghese usa la variante europea, con codice generico pt.

## Lingua automatica senza cookie

Solo la pagina di ingresso carica static/language.js.
navigator.languages è letto nell’ordine di preferenza, con navigator.language
come riserva. Si usa la prima lingua disponibile fra i link generati.
it-CH diventa it; en-US diventa en; fr-CA diventa fr; pt-BR diventa pt;
es-MX diventa es. Se non c’è corrispondenza si usa l’inglese.
Le pagine linguistiche e le informative non reindirizzano, così i link diretti
e la scelta manuale sono rispettati. Senza JavaScript resta la scelta manuale.

Nell’header le cinque lingue sono raccolte in un menu a tendina con pulsante
quadrato che mostra la sigla corrente. Usa details/summary nativi: si apre anche
da tastiera e senza JavaScript; le opzioni restano normali link alle pagine.
Il nome accessibile include la sigla visibile, l’icona SVG è decorativa e lo stato
aperto/chiuso è esposto dal controllo nativo, senza aria-expanded duplicati.
Con JavaScript, Esc chiude e riporta il focus al selettore; click esterno e uscita
del focus chiudono la tendina senza spostare il focus.

La navbar usa etichette brevi tradotte, distinte dai titoli delle sezioni, e non
va a capo. Su schermi estremamente stretti o con testo ingrandito può scorrere
orizzontalmente; i link mantengono dimensioni e focus visibile entro la barra.

Nessun cookie, localStorage, sessionStorage, geolocalizzazione o memorizzazione
della preferenza. Solo normali richieste delle pagine al server.

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

| Asset in static | Originale in reference | Uso |
|---|---|---|
| logo-wordmark.svg | loghi/06-scritta/svg/ibis-scritta-colore.svg | Scelta lingua |
| logo-symbol.svg | loghi/02-simbolo/svg/ibis-simbolo-colore.svg | Navbar |
| logo-general.svg | loghi/01-generale/svg/ibis-generale-colore.svg | Hero grande con mondo |
| logo-mini.svg | loghi/05-simbolo-minimo/svg/ibis-minimo-colore.svg | Bullet attività |
| favicon.svg, favicon.ico | web-favicon/ | Icone browser |
| apple-touch-icon.png | web-favicon/apple-touch-icon.png | Icona Apple |
| palette.css | palette/ibis-palette.css | Palette approvata |

Identità aggiornata alla guida del 13 novembre 2026. Gli SVG sono copiati senza
modificare disegni, colori o proporzioni. Il logo generale è mostrato su fondo
chiaro ad almeno 600 px sui desktop; sotto 1100 px l’hero passa a una colonna.
Anche sui telefoni viene mantenuto il logo generale con mondo, largo quanto lo
spazio disponibile e con altezza proporzionale, senza altezza minima o padding nel pannello. L’header usa il simbolo completo a colori (96 px). Il pannello dell’hero ha
fondo trasparente e lascia visibile lo sfondo della pagina. Il planisfero resta nella sola composizione generale.

Nessuna guida, presentazione o variante non usata entra in dist.
Nessuna fotografia è stata aggiunta. Font di sistema e Georgia.

Fonti dei dati aziendali:

- https://www.ibissrl.biz/contatti: indirizzo operativo, nomi, email e telefoni.
- https://www.ibissrl.biz/servizi-prodotti: conferma dei prodotti già nel brief.
- `reference/visura 06 11 2026.pdf`: visura ordinaria del Registro Imprese
  di Ferrara e Ravenna, estratta il 06/11/2026 (documento T 681230907).
  Conferma IBIS SRL, sede legale in Viale Baracca 89, 48121 Ravenna (RA),
  P.IVA/C.F. e iscrizione al Registro Imprese 01286410392, REA RA-133634,
  PEC ibissrl@mypec.eu, capitale sottoscritto €30.000,00 e versato €18.750,00.
  Costituzione: 11/11/1994; inizio attività: 06/02/1995; amministratrice unica:
  Isabella Tebaldi. La società risulta attiva con due soci; non risulta in
  liquidazione. I dati sono riportati nelle cinque lingue, nei contatti,
  nel footer e nell'identificazione aziendale della privacy. La visura e i dati
  personali dei soci (domicili, codici fiscali, date di nascita e PEC personale)
  non vengono copiati nel sito.
- https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876:
  riferimento su cookie e strumenti di tracciamento.

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

## Cosa mi rimane da fare

Dopo il deploy autorizzato, verificare HTTP/redirect, inviare la sitemap
in Search Console e controllare l’indicizzazione. Un’immagine social
dedicata è un miglioramento facoltativo, non ancora presente.

## Update on my server

```cmd
tar -czf ibis-dist.tar.gz -C dist .
scp ibis-dist.tar.gz root@62.238.112.117:/root/ibis-dist.tar.gz
```

```bash
ibis_new=$(mktemp -d /var/www/ibis-release-XXXXXX)
tar -xzf /root/ibis-dist.tar.gz -C "$ibis_new"
chown -R root:root "$ibis_new"
find "$ibis_new" -type d -exec chmod 755 {} +
find "$ibis_new" -type f -exec chmod 644 {} +
ls -la "$ibis_new"

ibis_backup="/var/www/ibis-backup-$(date +%Y%m%d-%H%M%S)"
mv /var/www/ibis "$ibis_backup" && mv "$ibis_new" /var/www/ibis
```

rollback:
```bash
mv /var/www/ibis "${ibis_new}-non-ok" && mv "$ibis_backup" /var/www/ibis
```
