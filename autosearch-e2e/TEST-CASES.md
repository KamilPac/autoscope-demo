# AutoSearch E2E - Dokumentacja Case'ow Testowych

Ten dokument jest centralna lista aktualnie zaimplementowanych scenariuszy E2E.
Opisuje:
- zakres projektu testowego,
- mapowanie case -> plik testu,
- priorytety P0/P1/P2,
- uruchamianie lokalne i mapowanie do CI.

## 1. Zakres projektu testowego

Projekt `autosearch-e2e` testuje krytyczne flow aplikacji AutoSearch:
- autoryzacja i ochrona tras,
- search/lista/szczegoly,
- observe/bid,
- import lotow,
- panel user/admin,
- regresje danych (spojnosc, deduplikacja obrazow),
- smoke responsive (mobile viewport).

## 2. Priorytety i paczki

- P0: krytyczne scenariusze uruchamiane na PR/manual (`npm run test:p0`)
- P1: wysoki priorytet funkcjonalny (`npm run test:p1`)
- P2: scenariusze uzupelniajace i regresyjne (`npm run test:p2`)
- Mobile smoke: szybki zestaw responsive (`npm run test:mobile:smoke`)

## 3. Rejestr case'ow

| ID | Priorytet | Obszar | Opis scenariusza | Plik testu | W paczce |
|---|---|---|---|---|---|
| AUTH-001 | P0 | Auth | Guest z chronionej trasy jest przekierowany do login | tests/auth/auth-guard.spec.ts | test:p0 |
| AUTH-002 | P0 | Auth | Poprawne logowanie i wylogowanie | tests/auth/login-logout.spec.ts | test:p0 |
| AUTH-003 | P0 | Auth | Powrot na URL `next` po logowaniu | tests/auth/login-next-redirect.spec.ts | test:p0 |
| CARS-001 | P0 | Cars | Search -> details -> back | tests/cars/search-to-details.spec.ts | test:p0 |
| CARS-002 | P0 | Cars/Bid | Observe + ustawienie max bid + widocznosc w panelu | tests/cars/observe-bid-flow.spec.ts | test:p0 |
| CARS-003 | P0 | Cars/Observe | Remove from observed + empty state + stan w detalu | tests/cars/observe-remove.spec.ts | test:p0 |
| IMPORT-001 | P0 | Import | Import lotu (stabilny mock) + komunikat sukcesu | tests/import/import-lot.spec.ts | test:p0 |
| IMPORT-002 | P0 | Import/Cars | Import-bulk -> search -> details (deterministyczny) | tests/import/import-bulk-search-details.spec.ts | test:p0 |
| DATA-001 | P0 | Data | Spojnosc pola karta listy vs detale | tests/cars/data-consistency.spec.ts | test:p0 |
| PANEL-001 | P1 | Panel | Zmiana display name i widocznosc w panelu | tests/panel/profile-settings.spec.ts | test:p1 |
| PANEL-002 | P1 | Panel/Auth | Zmiana hasla (blad + sukces) | tests/panel/change-password.spec.ts | test:p1 |
| CARS-004 | P1 | Cars/Bid | Blokada bid controls dla statusu sold/closed | tests/cars/sold-lock.spec.ts | test:p1 |
| IMPORT-003 | P1 | Import | Obsluga bledu importu i komunikat dla usera | tests/import/import-lot-error.spec.ts | test:p1 |
| PANEL-003 | P1 | Panel | Dostepnosc zakladek Profile/Observed/Bids | tests/panel/panel-tabs.spec.ts | test:p1 |
| ADMIN-001 | P1 | Admin | User bez roli admin nie ma dostepu do admin panel | tests/admin/admin-access.spec.ts | test:p1 |
| ADMIN-002 | P2 | Admin | Admin usuwa zapisane auto z lokalnych store'ow | tests/admin/admin-delete-car.spec.ts | test:p2 |
| DATA-002 | P2 | Images | Regresja deduplikacji miniatur w galerii detalu | tests/cars/image-dedup.spec.ts | test:p2 |
| CARS-005 | P2 | Cars/Filters | Dodatkowe warianty filtrowania/sortowania/paginacji | tests/cars/filter-sort-pagination.spec.ts | test:p2 |
| PANEL-004 | P2 | Panel | Zarzadzanie wieloma pozycjami observed | tests/panel/observed-multi.spec.ts | test:p2 |
| RWD-001 | P2 | Responsive | Mobile smoke dla kluczowych flow | tests/responsive/mobile-core-flows.spec.ts | test:p2 + test:mobile:smoke |
| IMPORT-004 | Nightly smoke | Import | Realny import zewnętrznego URL (gdy secret jest ustawiony) | tests/import/import-external-nightly.spec.ts | test:import:external-smoke |

Uwaga dla IMPORT-004:
- Wymagany secret repozytorium: `EXTERNAL_IMPORT_SMOKE_URL`.
- Bez secretu test jest pomijany lokalnie i job nightly jest pomijany w CI.

## 4. Uruchamianie

Najczesciej uzywane komendy:
- `npm run test:p0`
- `npm run test:p1`
- `npm run test:p2`
- `npm run test:mobile:smoke`
- `npm run test:import:external-smoke`
- `npm run test:all`

Stabilnosc P0:
- `npm run test:p0:repeat20`
- `npm run report:p0:passrate`
- `npm run qa:p0:stability`

## 5. Mapowanie do CI

Workflow: `.github/workflows/playwright-e2e.yml`

- PR/manual:
  - job `e2e-p0` -> `npm run test:p0`
  - job `e2e-mobile-smoke` -> `npm run test:mobile:smoke`
- Nightly:
  - job `e2e-nightly-full` -> `npm run test:all`
  - job `e2e-nightly-p0-stability` -> `npm run qa:p0:stability`
  - job `e2e-nightly-external-import-smoke` -> `npm run test:import:external-smoke` (z sekretem `EXTERNAL_IMPORT_SMOKE_URL`)

Required checks (zalecane na PR):
- `e2e-p0`
- `e2e-mobile-smoke`

## 6. Jak dodawac nowy case

1. Dodaj plik `*.spec.ts` do odpowiedniego katalogu `tests/*`.
2. Jesli trzeba, rozszerz POM w `pom/*` (utrzymuj DRY).
3. Dodaj scenariusz do odpowiedniej paczki (`test:p0`, `test:p1` lub `test:p2`).
4. Uruchom lokalnie odpowiednia paczke i potwierdz zielony wynik.
5. Dopisz wpis do tabeli w tym pliku (ID, opis, priorytet, paczka).

## 7. Uwagi operacyjne

- Testy sa deterministyczne dzieki resetowi danych przed kazdym testem.
- Dla importu zewnetrznego na PR uzywamy scenariuszy stabilnych (mock/bulk seed).
- Artefakty (html, trace, screenshot, video, junit) sa publikowane w CI.
