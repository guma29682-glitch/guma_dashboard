# GUMA OS starter

Staticky zaklad osobniho informacniho systemu pro GitHub Pages.

## Co je uvnitr

- `index.html` - hlavni webova aplikace.
- `assets/app.css` - vzhled.
- `assets/app.js` - nacitani JSON dat a prepinani modulu.
- `data/latest.json` - posledni aktualni stav dashboardu.
- `data/manifest.json` - seznam modulu a archiv reportu.
- `data/reports/YYYY-MM-DD.json` - denni strukturovane snapshoty.
- `reports/YYYY-MM-DD.html` - volitelny HTML archiv.
- `.nojekyll` - vypne Jekyll transformaci na GitHub Pages.

## Nasazeni na GitHub Pages

1. Nahraj obsah teto slozky do repozitare `guma_dashboard`.
2. Na GitHubu otevri `Settings -> Pages`.
3. Nastav `Deploy from a branch`, branch `main`, folder `/root`.
4. Po ulozeni bude web dostupny na `https://guma29682-glitch.github.io/guma_dashboard/`.

## Jak ma fungovat automaticky release

Kazdy beh GUMA agenta vygeneruje nova data a provede release:

1. Nacte zdroje: Google Calendar, Gmail guma, Google Drive, webove zdroje.
2. Vygeneruje verejne bezpecny JSON report.
3. Prepise `data/latest.json`.
4. Prida `data/reports/YYYY-MM-DD.json`.
5. Aktualizuje `data/manifest.json`.
6. Volitelne prida `reports/YYYY-MM-DD.html`.
7. Pushne zmeny do `main`; GitHub Pages je automaticky vystavi.

## Soukromi

Do public webu patri jen informace oznacene jako bezpecne pro publikovani. Tokeny, cele e-maily, osobni zdravotni detaily a nakupni credentials se nikdy neukladaji do repozitare.

Pro budoucnost je vhodne delit kazdou informaci na:

- `public` - muze na web.
- `private_summary` - jen opatrne shrnuti.
- `private` - zustava mimo GitHub.
- `action_required` - ceka na potvrzeni uzivatele.
