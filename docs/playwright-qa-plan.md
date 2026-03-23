# Plan QA i Automatyzacji Testów Funkcjonalnych (Playwright + TypeScript)

## 1. Cel dokumentu

Celem jest przygotowanie praktycznego planu testów automatycznych dla najczęściej używanych i najbardziej krytycznych ścieżek użytkownika w aplikacji AutoScope.

Zakładamy koncentrację na testach funkcjonalnych UI i przepływach użytkownika (end-to-end z perspektywy przeglądarki), uruchamianych lokalnie.

## 2. Zakres i założenia

### Zakres testów
- Logowanie, autoryzacja i ochrona tras.
- Wyszukiwanie pojazdów i przejście do szczegółów.
- Kluczowe akcje na szczegółach pojazdu: obserwowanie, planowanie maksymalnej oferty.
- Panel użytkownika: zakładki Profile, Observed, Bids.
- Import lotu po URL i widoczność zaimportowanego rekordu.
- Spójność danych pomiędzy listą pojazdów i widokiem szczegółów.
- Podstawowe ścieżki uprawnień admina.

### Poza zakresem (na ten etap)
- Testy wydajnościowe.
- Testy bezpieczeństwa (pentest).
- Pełna walidacja integracji z zewnętrznymi źródłami danych w każdym teście PR.

### Ważne założenie techniczne
Nie trzeba mieć aplikacji wystawionej publicznie.
Testy Playwright mogą działać lokalnie, startując lokalny serwer Next.js.

## 3. Mapa krytycznych obszarów aplikacji

### Warstwa dostępu i sesji
- Middleware tras chronionych: [middleware.ts](../middleware.ts)
- Logowanie UI: [src/app/login/page.tsx](../src/app/login/page.tsx)
- Logowanie API: [src/app/api/auth/login/route.ts](../src/app/api/auth/login/route.ts)
- Endpoint bieżącej sesji: [src/app/api/auth/me/route.ts](../src/app/api/auth/me/route.ts)

### Główne ścieżki użytkownika
- Lista pojazdów i filtry: [src/app/cars/page.tsx](../src/app/cars/page.tsx)
- Karta pojazdu: [src/components/car-card.tsx](../src/components/car-card.tsx)
- Szczegóły pojazdu i akcje: [src/app/cars/[id]/page.tsx](../src/app/cars/%5Bid%5D/page.tsx)
- Panel użytkownika: [src/app/panel/page.tsx](../src/app/panel/page.tsx)
- Import lotu: [src/app/import-lot/page.tsx](../src/app/import-lot/page.tsx)
- API importu: [src/app/api/lots/import/route.ts](../src/app/api/lots/import/route.ts)

### Obszary o podwyższonym ryzyku regresji
- Lookup szczegółów auta i priorytet źródeł danych: [src/lib/server/auction-search-service.ts](../src/lib/server/auction-search-service.ts)
- Import i mapowanie danych pojazdu: [src/lib/server/lot-url-importer.ts](../src/lib/server/lot-url-importer.ts)
- Deduplikacja/normalizacja obrazów: [src/lib/vehicle-image-filter.ts](../src/lib/vehicle-image-filter.ts)

### Lokalna persystencja (wpływ na stabilność testów)
- Konta: [src/lib/server/accounts-repository.ts](../src/lib/server/accounts-repository.ts)
- Importowane loty: [src/lib/server/imported-lots-repository.ts](../src/lib/server/imported-lots-repository.ts)
- Ostatnie rekordy: [src/lib/server/recent-cars-repository.ts](../src/lib/server/recent-cars-repository.ts)
- Obserwowane: [src/lib/server/watchlist-repository.ts](../src/lib/server/watchlist-repository.ts)
- Maksymalne oferty: [src/lib/server/max-bid-repository.ts](../src/lib/server/max-bid-repository.ts)
- Cache wyszukiwania: [src/lib/server/search-cache-repository.ts](../src/lib/server/search-cache-repository.ts)

## 4. Priorytety testowe

### P0 (krytyczne, uruchamiane na każdym PR)
1. User bez sesji trafia z chronionej trasy na login i po logowaniu wraca na właściwy ekran.
2. Poprawne logowanie i wylogowanie.
3. Wyszukanie pojazdu, wejście w szczegóły, powrót do listy.
4. Observe/unobserve z poziomu szczegółów + widoczność w zakładce Observed.
5. Ustawienie max bid (+/- i ręczne) + widoczność w zakładce Bids.
6. Import lotu po URL (scenariusz stabilny) + pojawienie się rekordu na liście.
7. Spójność kluczowych pól między kartą na liście a detalami (dla tego samego id).

### P1 (wysoki priorytet)
1. Zmiana ustawień profilu (display name) i widoczność w UI.
2. Zmiana hasła: walidacja błędu i sukces.
3. Blokada licytacji dla statusu sold/closed.
4. Obsługa błędu importu i poprawna informacja dla użytkownika.
5. Uprawnienia admin-only dla panelu admin-cars.

### P2 (uzupełniające)
1. Operacje admina na rekordach lokalnych.
2. Regresja deduplikacji zdjęć.
3. Dodatkowe warianty filtrów/sortowania/paginacji.
4. Testy responsywności dla wybranych flow.

## 5. Strategia automatyzacji

### Typy testów
- UI E2E: domyślna warstwa testów.
- API helper tests (opcjonalnie): szybkie walidacje endpointów lokalnych przez request context.

### Zasady stabilności
- Priorytet na deterministyczne dane testowe.
- Ograniczenie zależności od zewnętrznych serwisów w testach PR.
- Izolacja stanu testów przez reset plików w katalogu data.

### Podejście do importu zewnętrznego
- Testy PR: scenariusz importu w trybie kontrolowanym (stub/mock lub dedykowany stabilny URL).
- Testy nightly: realne URL-e zewnętrzne jako smoke (niestabilne przez anty-bot/challenge).

## 6. Plan wdrożenia krok po kroku

## Krok 1: Ustalenie architektury testów
- Cel: zbudować bazową strukturę testów i konwencje.
- Działania:
  - Utworzyć katalog testów Playwright.
  - Wydzielić helpery logowania i resetu danych.
  - Ustalić nazewnictwo scenariuszy oraz tagowanie P0/P1/P2.
- Rezultat: gotowy szkielet do szybkiego dokładania przypadków.

## Krok 2: Konfiguracja środowiska Playwright
- Cel: uruchamianie testów lokalnie i w CI w sposób powtarzalny.
- Działania:
  - Konfiguracja baseURL i webServer (start aplikacji lokalnie).
  - Ustawienie retry tylko tam, gdzie uzasadnione.
  - Konfiguracja trace/screenshot/video na failure.
- Rezultat: powtarzalne uruchamianie testów bez ręcznej obsługi.

## Krok 3: Zarządzanie danymi testowymi
- Cel: eliminacja flakiness wynikającej z lokalnej persystencji JSON.
- Działania:
  - Przygotować reset stanu przed testami:
    - accounts.json (jeśli potrzeba scenariuszy kont),
    - imported-lots.json,
    - recent-cars.json,
    - watchlist.json,
    - user-max-bids.json,
    - search-cache.json.
  - Dodać seed minimalnych danych testowych.
- Rezultat: każdy test startuje z przewidywalnego stanu.

## Krok 4: Implementacja smoke P0 dla dostępu i sesji
- Cel: zabezpieczyć najważniejsze wejścia do aplikacji.
- Działania:
  - Testy redirectów middleware dla tras chronionych.
  - Test poprawnego logowania i wylogowania.
  - Test next redirect po logowaniu.
- Rezultat: stabilne fundamenty autoryzacji.

## Krok 5: Implementacja P0 dla głównego flow użytkownika
- Cel: pokryć codzienny scenariusz pracy użytkownika.
- Działania:
  - Search -> card -> details -> back.
  - Observe z detali i weryfikacja w panelu Observed.
  - Remove from observed i weryfikacja usunięcia.
- Rezultat: pokrycie najczęściej używanej ścieżki użytkownika.

## Krok 6: Implementacja P0 dla bidding flow
- Cel: zabezpieczyć logikę planowania oferty.
- Działania:
  - Test +/− max bid.
  - Test ręcznego ustawienia kwoty.
  - Weryfikacja odczytu wartości w detalu i panelu Bids.
- Rezultat: pewność działania kluczowej funkcji biznesowej.

## Krok 7: Implementacja P0 dla importu
- Cel: pokryć krytyczny punkt zasilania danych.
- Działania:
  - Import URL -> komunikat sukcesu/błędu.
  - Wyszukanie zaimportowanego lotu.
  - Wejście w detale i walidacja kluczowych pól.
- Rezultat: kontrola jakości całego przepływu import -> lista -> detale.

## Krok 8: Test spójności danych między widokami
- Cel: zapobiec regresjom typu lista ma dane, detale nie mają.
- Działania:
  - Porównać pola bazowe i rozszerzone między listą i detalami dla tego samego id.
  - Dodać asercje na pola krytyczne: silnik, skrzynia, napęd, przebieg, lokalizacja.
- Rezultat: szybkie wykrywanie rozjazdów danych.

## Krok 9: Scenariusze P1 i admin
- Cel: zwiększyć pokrycie obszarów operacyjnych i uprawnień.
- Działania:
  - Profile settings i change password.
  - Access control admin-cars.
  - Podstawowe operacje admin panelu na lokalnych rekordach.
- Rezultat: ograniczenie regresji w obszarach wsparcia i administracji.

## Krok 10: Stabilizacja i raportowanie jakości
- Cel: utrzymać testy długoterminowo.
- Działania:
  - Analiza flaky testów.
  - Korekta selektorów i wait strategy.
  - Dashboard wyników i metryki pass rate.
- Rezultat: testy wiarygodne i użyteczne w CI.

## 7. Struktura testów (proponowana)

- tests/auth/
  - auth-guard.spec.ts
  - login-logout.spec.ts
- tests/cars/
  - search-to-details.spec.ts
  - observe-flow.spec.ts
  - bid-flow.spec.ts
  - data-consistency.spec.ts
- tests/import/
  - import-lot.spec.ts
- tests/panel/
  - panel-profile.spec.ts
  - panel-observed.spec.ts
  - panel-bids.spec.ts
- tests/admin/
  - admin-access.spec.ts
  - admin-cache-management.spec.ts
- tests/fixtures/
  - auth.fixture.ts
  - data-reset.fixture.ts
- tests/helpers/
  - login.helper.ts
  - data.helper.ts

## 8. Dane testowe i reset stanu

Przed każdym testem lub suitą (w zależności od kosztu) resetować pliki danych w katalogu data do stanu bazowego.

Minimalne pliki kontrolowane:
- data/imported-lots.json
- data/recent-cars.json
- data/watchlist.json
- data/user-max-bids.json
- data/search-cache.json

Konta testowe:
- admin: domyślnie z seeded accounts
- user: domyślnie z seeded accounts

## 9. Kryteria akceptacji dla pierwszego wydania testów

Warunki minimalne:
1. Wszystkie scenariusze P0 działają stabilnie lokalnie.
2. Pass rate P0 >= 95% na 20 kolejnych uruchomieniach lokalnych.
3. Trace i screenshot zapisują się dla każdego failure.
4. Testy P0 kończą się w akceptowalnym czasie (docelowo <= 10 minut lokalnie).

## 10. Ryzyka i działania zapobiegawcze

Ryzyko: niestabilne dane z zewnętrznych źródeł importu.
- Mitigacja: PR oparty o kontrolowane dane, nightly dla realnych URL.

Ryzyko: flakiness przez współdzielone pliki JSON.
- Mitigacja: twardy reset danych i kontrola równoległości testów.

Ryzyko: niestabilne selektory UI.
- Mitigacja: ustandaryzowane data-test atrybuty dla kluczowych elementów.

## 11. Co będzie robione dalej (operacyjnie)

Po akceptacji tego dokumentu realizacja pójdzie dokładnie tą kolejnością:
1. Konfiguracja Playwright + webServer.
2. Fixture resetu danych i helper logowania.
3. Implementacja P0 (auth, search-details, observed, bids, import, spójność).
4. Stabilizacja P0 i dopiero potem P1.
5. Włączenie do CI i raportowanie.

To podejście daje szybki zwrot biznesowy: najpierw zabezpieczamy ścieżki, które użytkownik wykonuje najczęściej i które najbardziej bolą przy regresji.
