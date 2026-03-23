## AutoScope Demo

Frontend demo for searching cars from US auction sources with integration-ready architecture.

The app supports two modes:
- `demo` (default): local mocked data.
- `live`: fetches data from external provider endpoint (you configure URL + API key).

## Getting Started

1. Copy env template:

```bash
cp .env.example .env.local
```

2. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## User login and panel

- Sign in page: `/login`
- User panel: `/panel`
- Protected pages (require login): `/cars`, `/import-lot`, `/panel`

Demo credentials are set by env vars:

```bash
DEMO_AUTH_USERNAME=admin
DEMO_AUTH_PASSWORD=admin123
DEMO_USER_USERNAME=user
DEMO_USER_PASSWORD=user123
```

Roles:
- `admin`: full access (search + import)
- `user`: access to search and panel (no import)

In `/panel` user can:
- set display name,
- change account password.

Admin extras in `/panel`:
- open dedicated panel `/panel/admin-cars`,
- browse saved cars stored locally,
- delete a single car by id from local stores (cache/import/recent).

## API endpoint

Cars search endpoint:

`GET /api/cars`

Supported query params:
- `q`
- `make`
- `source` (`all` | `marketcheck`)
- `minYear`
- `maxYear`
- `maxMileageKm`
- `sort` (`ending_soon` | `newest` | `price_low` | `price_high`)
- `page`

Bulk import endpoint for automation:

`POST /api/lots/import-bulk`

Payload:

```json
{
	"lots": [
		{
			"id": "marketcheck-12345678",
			"source": "marketcheck",
			"lotNumber": "12345678",
			"vin": "UNKNOWNVIN0000000",
			"year": 2021,
			"make": "Toyota",
			"model": "Camry",
			"trim": "SE",
			"engine": "Not provided",
			"drivetrain": "Not provided",
			"transmission": "AT",
			"mileageKm": 0,
			"location": "MarketCheck",
			"damage": "normal_wear",
			"titleStatus": "Imported via Playwright",
			"sellerType": "Unknown",
			"runAndDrive": false,
			"hasKeys": false,
			"estimateMinUsd": 0,
			"estimateMaxUsd": 0,
			"currentBidUsd": 0,
			"imageUrl": "https://..."
		}
	]
}
```

## Live mode configuration

Set in `.env.local`:

```bash
AUCTION_DATA_MODE=live
MARKETCHECK_PROVIDER_URL=https://api.marketcheck.com/v2/search/car/active
MARKETCHECK_PROVIDER_API_KEY=...
```

Important:
- Keep integrations compliant with source platform terms.
- Recommended approach is official/partner APIs or licensed data feeds.

Search cache:
- Search results are cached locally in `data/search-cache.json`.
- If the same filter/query is requested again, app reuses local cache instead of calling MarketCheck API.

## E2E in GitHub Actions

Workflow file:
- `.github/workflows/playwright-e2e.yml`

When tests run:
- On pull requests: jobs `e2e-p0` and `e2e-mobile-smoke` run.
- On manual trigger (`workflow_dispatch`): jobs `e2e-p0` and `e2e-mobile-smoke` run.
- On nightly schedule: jobs `e2e-nightly-full` and `e2e-nightly-p0-stability` run.

Notes:
- P0 pass rate is published in GitHub Actions Job Summary.

How to run manually in GitHub:
1. Open repository tab `Actions`.
2. Select workflow `Playwright E2E`.
3. Click `Run workflow` and confirm branch.

Where to find results:
- Open a workflow run and check job logs (`e2e-p0` or `e2e-nightly-full`).
- Download artifacts:
	- `playwright-report-*` (HTML report)
	- `test-results-*` (traces/screenshots/videos)

Equivalent local commands (from `autosearch-e2e`):
- `npm run test:p0`
- `npm run test:p1`
- `npm run test:p2`
- `npm run test:mobile:smoke`
- `npm run test:all`
- `npm run report:p0:passrate`
- `npm run qa:p0:stability`

P0 scope includes observed removal regression (`observe-remove.spec.ts`) in addition to auth/search/bid/import core checks.

Branch protection checklist (GitHub):
1. Open repository settings: `Settings -> Branches -> Branch protection rules`.
2. Add or edit rule for your main branch.
3. Enable `Require status checks to pass before merging`.
4. Mark these checks as required:
	- `e2e-p0`
	- `e2e-mobile-smoke`
5. Optional recommended checks for stricter policy:
	- `e2e-nightly-full` (monitoring only; usually not required for PR merge)
	- `e2e-nightly-p0-stability` (monitoring only; usually not required for PR merge)

## Next steps

- Add provider-specific payload mapping in `src/lib/server/http-provider.ts`.
- Add authenticated backend proxy for production feeds.
- Move details page from mock-only to provider-backed lookup by `id`/`lot`.
