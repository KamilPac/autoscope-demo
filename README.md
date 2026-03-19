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

## Next steps

- Add provider-specific payload mapping in `src/lib/server/http-provider.ts`.
- Add authenticated backend proxy for production feeds.
- Move details page from mock-only to provider-backed lookup by `id`/`lot`.
