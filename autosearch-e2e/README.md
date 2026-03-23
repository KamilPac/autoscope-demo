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
- npm run test:all

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
  - import lot (stub API dla stabilnosci)

## CI/CD

Workflow GitHub Actions jest w:

- .github/workflows/playwright-e2e.yml

Zasada uruchamiania:

- pull request i workflow_dispatch: uruchamiany pakiet P0
- nightly (schedule): uruchamiany pelny pakiet testow
