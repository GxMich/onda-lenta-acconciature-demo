# Onda Lenta Acconciature — sito dimostrativo

**Demo online → https://gxmich.github.io/onda-lenta-acconciature-demo/**

> ### Attività di fantasia
>
> **Onda Lenta Acconciature non esiste.** Nome del salone e della titolare, indirizzo
> a Borgo Sorive (un paese inventato), telefono, email, partita IVA, orari e
> recensioni sono inventati e servono solo a mostrare il funzionamento del sito.
>
> L'email usa il dominio `onda-lenta-acconciature.example`: `.example` è un TLD
> riservato dallo IANA e non può recapitare posta a nessuno. Il telefono è
> `+39 000 000 0000`.
>
> Tutte le pagine hanno `<meta name="robots" content="noindex, nofollow">` e il
> `robots.txt` blocca tutto il sito: un'attività inesistente non deve finire nelle
> ricerche locali.

Sito realizzato da [Michele Modica](https://www.modicamichele.it).

## Cosa mostra la demo

Il sito di un piccolo salone da parrucchiera, pensato prima di tutto per il telefono:

- **Richiesta di appuntamento in quattro passaggi**: servizio, giorno e orario,
  recapito, riepilogo. Gli orari proposti seguono l'apertura del salone (pausa del
  giovedì compresa), saltano i giorni di chiusura e, se scegli oggi, le ore già passate,
  sempre secondo l'ora italiana.
- **L'invio è simulato**: il riepilogo si può copiare, ma il pulsante finale mostra solo
  un messaggio di conferma. Non parte nessuna email e nessun dato viene salvato.
- **Menu mobile** a schermo intero con focus protetto, blocco dello scroll e ripristino
  della posizione.
- **Barra fissa su mobile** con il pulsante di prenotazione sempre a portata di pollice.
- Servizi, galleria di ispirazioni, recensioni (dimostrative), orari e domande frequenti.
- Animazioni di menu, passaggi e controlli, disattivate con `prefers-reduced-motion`.

## Tecnologie

- HTML, CSS e JavaScript senza framework e senza build.
- Logica di prenotazione separata in `booking-core.js`, con test in Node.
- Font DM Sans e Bodoni Moda serviti in locale (licenze OFL in `assets/`): nessuna
  richiesta a servizi esterni.

## Come avviarla

Basta aprire `index.html` nel browser. In alternativa, con un piccolo server:

```sh
python -m http.server 4173
```

e poi `http://localhost:4173`.

Test della logica di prenotazione:

```sh
node --test tests/booking-core.test.js
```

## Struttura

```
index.html          La pagina principale
privacy.html        Privacy e cookie del sito dimostrativo
styles.css          Stili di base
experience.css      Menu, prenotazione, animazioni e versione mobile
app.js              Interazioni della pagina e del modulo
booking-core.js     Orari di apertura, date, validazione, riepilogo
tests/              Test della logica di prenotazione
assets/             Foto, font, favicon
CREDITI-FOTO.md     Autori e licenze delle foto
```
