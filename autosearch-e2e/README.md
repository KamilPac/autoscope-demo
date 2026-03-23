# AutoSearch E2E (Playwright)

Oddzielny projekt testow funkcjonalnych Playwright dla aplikacji AutoSearch.

## Uruchomienie

1. Przejdz do katalogu projektu testow.
2. Zainstaluj zaleznosci.
3. Zainstaluj przegladarki Playwright.
4. Uruchom testy.

Przykladowe komendy:

- npm install
- npm run install:browsers
- npm run test:p0
- npm run test:p1
- npm run test:p2
- npm run test:mobile:smoke
- npm run test:all
- npm run test:p0:repeat20
- npm run report:p0:passrate
- npm run qa:p0:stability

## Zmienne opcjonalne

- APP_WEB_DIR: sciezka do katalogu aplikacji Next.js (domyslnie ../app-web)
- E2E_PORT: port aplikacji uruchamianej przez webServer (domyslnie 3000)
- E2E_BASE_URL: adres bazowy testow (domyslnie http://127.0.0.1:{port})

## Co robi szkielet

- Resetuje pliki danych aplikacji przed kazdym testem.
- Loguje uzytkownika przez UI.
- Pokrywa pierwsze scenariusze P0:
  - auth guard
  - login/logout
  - search -> details -> back
  - observe + bid flow
  - remove from observed + empty state
  - import lot (stub API dla stabilnosci)

## CI/CD

Workflow GitHub Actions jest w:

- .github/workflows/playwright-e2e.yml

Zasada uruchamiania:

- pull request i workflow_dispatch: uruchamiany pakiet P0 oraz mobile smoke
- nightly (schedule): uruchamiany pelny pakiet testow oraz gate stabilnosci P0

## Stabilizacja i jakosc

- Do okresowej kontroli flakiness uruchamiaj: npm run test:p0:repeat20
- Aby policzyc pass rate z raportu junit.xml uruchamiaj: npm run report:p0:passrate
- Pelny gate (repeat + prog 95%) uruchamiaj: npm run qa:p0:stability
- Minimalny cel z planu QA: pass rate P0 >= 95% na 20 kolejnych uruchomieniach
- Raporty CI zawieraja HTML, trace/screenshot/video oraz junit.xml
- Pass rate P0 jest publikowany w Job Summary workflow

## Branch protection (zalecenie)

Docelowe required checks na PR:
- e2e-p0
- e2e-mobile-smoke

Nightly jobs traktuj jako monitoring, nie jako required check do merge:
- e2e-nightly-full
- e2e-nightly-p0-stability
